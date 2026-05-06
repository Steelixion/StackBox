// Pipeline step 2: Run forecasts and build the full dashboard cache
// Called by Supabase pg_cron 10 minutes after the market pipeline
// Reads from DB only — no scraping, no external calls, always fast

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { forecastAllRanges, aggregateForecasts, SalesPoint } from '@/lib/forecast';
import { buildInsightsFromStats, buildInventoryBuckets, buildSalesTimeline, ItemStat } from '@/lib/pipeline';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Fixed from SUPABASE_SERVICE_KEY
);

const PIPELINE_SECRET = process.env.PIPELINE_SECRET!;

export async function POST(req: NextRequest) {
  if (req.headers.get('x-pipeline-secret') !== PIPELINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runForecastPipeline();
}

// Vercel Cron handler — authenticates via CRON_SECRET
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runForecastPipeline();
}

async function runForecastPipeline() {

  try {
    // 1. Load all items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*');
    if (itemsError || !items) throw new Error('Failed to fetch items');

    // 2. Load all sales history in one query
    const { data: allSales, error: salesError } = await supabase
      .from('sales_history')
      .select('item_id, sale_date, quantity_sold, sale_price')
      .order('sale_date', { ascending: true });
    if (salesError) throw new Error('Failed to fetch sales history');

    // Group sales by item_id
    const salesByItem = new Map<number, { sale_date: string; quantity_sold: number; sale_price: number }[]>();
    for (const row of allSales ?? []) {
      if (!salesByItem.has(row.item_id)) salesByItem.set(row.item_id, []);
      salesByItem.get(row.item_id)!.push(row);
    }

    // 3. Load latest market prices in one query
    const { data: marketPrices } = await supabase
      .from('market_prices_latest')
      .select('item_id, market_price');
    const marketPriceMap = new Map((marketPrices ?? []).map(p => [p.item_id, Number(p.market_price)]));

    // 4. Per-item processing
    const forecastByItem: Record<string, Record<string, any[]>> = {};
    const forecastItems = ['All Items'];
    const itemStats: ItemStat[] = [];
    const insightUpserts: any[] = [];

    for (const item of items) {
      const itemId = Number(item.id);
      const name = String(item.name);
      forecastItems.push(name);

      const costPrice = Number(item.cost_price) || 0;
      const sellingPrice = Number(item.selling_price) || 0;
      const currentStock = Number(item.count) || 0;
      const leadTimeDays = Number(item.lead_time_days) || 7;
      let marketPrice = marketPriceMap.get(itemId);
      
      // If market price is missing, generate a mock realistic price for demo
      if (marketPrice === undefined) {
        // Consistent pseudo-random variation (-20% to +20%)
        const variation = ((itemId * 13) % 41) / 100 - 0.20; 
        marketPrice = sellingPrice * (1 + variation);
      }

      const salesRows = salesByItem.get(itemId) ?? [];
      const history: SalesPoint[] = salesRows.map(r => ({
        ds: new Date(r.sale_date),
        y: Number(r.quantity_sold),
      }));

      // Run forecast if we have enough history
      if (history.length >= 3) {
        forecastByItem[name] = forecastAllRanges(history);
      }

      // Compute business metrics
      const predicted30dDemand = history.length >= 3
        ? Math.max(0, Math.round(history.slice(-30).reduce((a, b) => a + b.y, 0) * (30 / Math.min(history.length, 30))))
        : 0;
      const expectedProfit = predicted30dDemand * (sellingPrice - costPrice);
      const dailyBurnRate = predicted30dDemand / 30;
      const daysUntilEmpty = dailyBurnRate > 0 ? currentStock / dailyBurnRate : 999;

      itemStats.push({ itemId, name, currentStock, costPrice, sellingPrice, marketPrice, leadTimeDays, predicted30dDemand, expectedProfit, dailyBurnRate, daysUntilEmpty });

      insightUpserts.push({
        item_id: itemId,
        predicted_30d_demand: predicted30dDemand,
        expected_profit: Math.round(expectedProfit),
        current_market_price: marketPrice,
        action_suggestion: daysUntilEmpty < leadTimeDays
          ? `Stockout in ${Math.floor(daysUntilEmpty)} days`
          : 'Stock optimal',
        updated_at: new Date().toISOString(),
      });
    }

    // 5. Build "All Items" aggregate forecast
    forecastByItem['All Items'] = aggregateForecasts(forecastByItem);

    // 6. Build all dashboard sections
    const insights = buildInsightsFromStats(itemStats);
    const inventoryBuckets = buildInventoryBuckets(itemStats);
    const salesByRange = buildSalesTimeline(
      (allSales ?? []).map(r => ({
        sale_date: r.sale_date,
        quantity_sold: Number(r.quantity_sold),
        sale_price: Number(r.sale_price),
      }))
    );

    // 7. Write daily_insights
    if (insightUpserts.length > 0) {
      const { error: insightError } = await supabase
        .from('daily_insights')
        .upsert(insightUpserts, { onConflict: 'item_id' });
      if (insightError) console.error('[pipeline/forecast] insight upsert error:', insightError);
    }

    // 8. Build and cache the complete dashboard payload
    const payload = {
      forecastItems: Array.from(new Set(forecastItems)),
      forecastByItem,
      salesByRange,
      ...insights,
      inventoryBuckets,
      last_trained: new Date().toISOString(),
    };

    const { error: cacheError } = await supabase
      .from('app_cache')
      .upsert({
        id: 'predictive_dashboard',
        data: payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (cacheError) throw new Error(`Cache write failed: ${cacheError.message}`);

    return NextResponse.json({
      message: 'Forecast pipeline complete',
      itemsProcessed: items.length,
      cacheUpdated: true,
    });

  } catch (err: any) {
    console.error('[pipeline/forecast]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
