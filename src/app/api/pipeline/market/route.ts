// Pipeline step 1: Fetch market prices for stale items (rolling batch of 4)
// Called by Supabase pg_cron every 30 minutes
// Processes only items not updated in the last 11 hours — full refresh completes across runs

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scrapeMarketPrice } from '@/lib/marketPrice';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Fixed from SUPABASE_SERVICE_KEY
);

const PIPELINE_SECRET = process.env.PIPELINE_SECRET!;
const BATCH_SIZE = 4;
const STALE_HOURS = 11;

export async function POST(req: NextRequest) {
  // Verify the request is from pg_cron (or your own manual trigger)
  if (req.headers.get('x-pipeline-secret') !== PIPELINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all items
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, name, selling_price');

    if (itemsError || !items) throw new Error('Failed to fetch items');

    // Fetch latest market prices to find stale ones
    const { data: latestPrices } = await supabase
      .from('market_prices_latest')
      .select('item_id, updated_at');

    const priceMap = new Map((latestPrices ?? []).map(p => [p.item_id, new Date(p.updated_at)]));
    const staleThreshold = new Date(Date.now() - STALE_HOURS * 3_600_000);

    // Find items whose price is stale or has never been fetched
    const staleItems = items.filter(item => {
      const lastUpdate = priceMap.get(item.id);
      return !lastUpdate || lastUpdate < staleThreshold;
    });

    if (staleItems.length === 0) {
      return NextResponse.json({ message: 'All prices are fresh', processed: 0 });
    }

    // Process next batch only
    const batch = staleItems.slice(0, BATCH_SIZE);
    const results: { itemId: number; price: number | null; source: string }[] = [];

    for (const item of batch) {
      // 2 second delay between requests to avoid rate limiting
      if (results.length > 0) await new Promise(r => setTimeout(r, 2_000));

      const scraped = await scrapeMarketPrice(item.name);

      if (scraped !== null) {
        results.push({ itemId: item.id, price: scraped, source: 'scraped' });
      } else {
        // Fallback: use last known price if available, otherwise use selling price as proxy
        const lastKnown = priceMap.get(item.id);
        const { data: lastRow } = await supabase
          .from('market_prices_latest')
          .select('market_price')
          .eq('item_id', item.id)
          .single();

        const fallbackPrice = lastRow?.market_price ?? item.selling_price;
        results.push({ itemId: item.id, price: fallbackPrice, source: 'cached' });
      }
    }

    // Upsert market_prices_latest — one row per item, always current
    const upsertRows = results.map(r => ({
      item_id: r.itemId,
      market_price: r.price,
      source: r.source,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from('market_prices_latest')
      .upsert(upsertRows, { onConflict: 'item_id' });

    if (upsertError) throw new Error(`Upsert failed: ${upsertError.message}`);

    // Insert snapshot into market_trends for historical tracking
    const snapshotRows = results.map(r => ({
      item_id: r.itemId,
      competitor_price: r.price,
      recorded_date: new Date().toISOString(),
    }));

    await supabase.from('market_trends').insert(snapshotRows);

    return NextResponse.json({
      message: 'Batch complete',
      processed: batch.length,
      remaining: staleItems.length - batch.length,
      results: results.map(r => ({ itemId: r.itemId, source: r.source })),
    });

  } catch (err: any) {
    console.error('[pipeline/market]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
