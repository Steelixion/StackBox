// Shared business logic — insight generation, payload building
// Used by both pipeline routes so logic is never duplicated

import { ForecastPoint } from './forecast';

export interface ItemStat {
  itemId: number;
  name: string;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  marketPrice: number;
  leadTimeDays: number;
  predicted30dDemand: number;
  expectedProfit: number;
  dailyBurnRate: number;
  daysUntilEmpty: number;
}

// Compact number formatter — no sign, magnitude only
// Callers add sign explicitly to prevent "++" double-sign bugs
export function fmt(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${(abs / 1_000).toFixed(1)}K`;
  return `${Math.round(abs)}`;
}

export function buildInsightsFromStats(stats: ItemStat[]) {
  const revenueItems: any[] = [];
  const stockRiskItems: any[] = [];
  const profitLeakItems: any[] = [];
  const priorityActions: any[] = [];
  const alertsFeed: any[] = [];
  const profitOpportunities: any[] = [];
  const marketComparison: any[] = [];
  const marketTrends: any[] = [];

  let totalOurPrice = 0;
  let totalMarketPrice = 0;
  let priceCount = 0;

  for (const stat of stats) {
    const {
      itemId, name, currentStock, costPrice, sellingPrice,
      marketPrice, leadTimeDays, predicted30dDemand,
      expectedProfit, dailyBurnRate, daysUntilEmpty,
    } = stat;

    // Revenue items — positive profit only
    if (expectedProfit > 0) {
      revenueItems.push({
        name,
        impact: `+${fmt(expectedProfit)} PKR`,
        dir: 'up',
        value: expectedProfit
      });
    } else if (expectedProfit < 0) {
      revenueItems.push({
        name,
        impact: `-${fmt(Math.abs(expectedProfit))} PKR`,
        dir: 'down',
        value: expectedProfit
      });
    }

    // Stock risk
    if (daysUntilEmpty < leadTimeDays) {
      const level = daysUntilEmpty <= 2 ? 'critical' : 'warning';
      stockRiskItems.push({
        name,
        status: currentStock === 0 ? 'Out of stock' : 'Low stock',
        level,
        daysUntilEmpty
      });

      priorityActions.push({
        rank: priorityActions.length + 1,
        item: name,
        problem: currentStock === 0 ? 'Out of stock' : 'Stock running out',
        reason: `Stock depletes in ${Math.floor(daysUntilEmpty)} days. Lead time is ${leadTimeDays} days.`,
        impact: `-${fmt(expectedProfit)} PKR/mo`,
        urgency: 'critical',
        action: 'Order now',
        category: 'Stock',
      });

      alertsFeed.push({
        id: itemId,
        issue: `${name} — Reorder Needed`,
        reason: `Stock depletes in ${Math.floor(daysUntilEmpty)} days. At current demand you will miss orders worth ${fmt(expectedProfit)} PKR this month.`,
        level: 'critical',
      });
    }

    // Profit leak — out of stock with active demand
    if (currentStock === 0 && dailyBurnRate > 0) {
      const dailyLoss = dailyBurnRate * (sellingPrice - costPrice);
      profitLeakItems.push({
        name,
        loss: `-${fmt(dailyLoss)} PKR/day`,
        reason: 'Out of stock — losing sales at current demand rate',
      });
    } else if (daysUntilEmpty < leadTimeDays && expectedProfit > 0) {
      const dailyLoss = dailyBurnRate * (sellingPrice - costPrice);
      profitLeakItems.push({
        name,
        loss: `-${fmt(dailyLoss)} PKR/day`,
        reason: `Imminent stockout — ${Math.floor(daysUntilEmpty)}d stock left, ${leadTimeDays}d lead time`,
      });
    }

    // Market comparison — per item row
    if (sellingPrice > 0 && marketPrice > 0) {
      totalOurPrice += sellingPrice;
      totalMarketPrice += marketPrice;
      priceCount++;

      const gapPct = ((sellingPrice - marketPrice) / marketPrice) * 100;
      const gapStr = gapPct >= 0 ? `+${gapPct.toFixed(1)}%` : `${gapPct.toFixed(1)}%`;

      let status: string, statusColor: string;
      if (Math.abs(gapPct) <= 5)    { status = 'Fair';          statusColor = 'jade'; }
      else if (gapPct > 10)         { status = 'Overpriced';    statusColor = 'cinnabar'; }
      else if (gapPct > 5)          { status = 'Slightly High'; statusColor = 'yellow'; }
      else if (gapPct < -20)        { status = 'Underpriced';   statusColor = 'cinnabar'; }
      else                          { status = 'Slightly Low';  statusColor = 'yellow'; }

      // Only add to marketComparison if the visible prices are actually different
      if (fmt(sellingPrice) !== fmt(marketPrice)) {
        marketComparison.push({
          id: itemId,
          metric: name,
          ours: `${fmt(sellingPrice)} PKR`,
          market: `${fmt(marketPrice)} PKR`,
          gap: gapStr,
          gapRaw: gapPct,
          ourPriceRaw: sellingPrice,
          marketPriceRaw: marketPrice,
          status,
          statusColor,
        });
      }

      // Profit opportunity — only when market is genuinely higher and gap > 1 PKR
      if (marketPrice > sellingPrice && (marketPrice - sellingPrice) > 1) {
        const gain = predicted30dDemand * (marketPrice - sellingPrice);
        const priceGapPct = ((marketPrice - sellingPrice) / sellingPrice) * 100;
        profitOpportunities.push({
          item: name,
          opportunity: `Price ${priceGapPct.toFixed(1)}% below market average`,
          gain: `+${fmt(gain)}`,
          risk: priceGapPct < 20 ? 'Low' : 'Medium',
          action: `Raise price to ${fmt(marketPrice)} PKR`,
          currentPrice: sellingPrice,
          suggestedPrice: marketPrice,
          demandRisk: priceGapPct < 20 ? 'Low' : 'Medium',
          detail: `Market avg is ${fmt(marketPrice)} PKR. Raising your price by ${priceGapPct.toFixed(1)}% keeps you competitive while improving margin.`,
        });
      }

      // Market trend signal
      const absPct = Math.abs(gapPct);
      let severity: string, direction: string, signal: string, action: string, detail: string;
      if (marketPrice < sellingPrice * 0.9) {
        severity = 'high'; direction = 'down';
        signal = 'Market price significantly below our listing';
        action = 'Lower your price';
        detail = `Market is ${absPct.toFixed(1)}% cheaper. You risk losing buyers to alternatives.`;
      } else if (marketPrice > sellingPrice * 1.1) {
        severity = 'opportunity'; direction = 'up';
        signal = 'Market price above our listing';
        action = 'Consider a price increase';
        detail = `Market is ${gapPct.toFixed(1)}% above your price — room to raise margin.`;
      } else if (marketPrice < sellingPrice * 0.95) {
        severity = 'medium'; direction = 'down';
        signal = 'Market price slightly below ours';
        action = 'Monitor pricing';
        detail = `Minor gap of ${absPct.toFixed(1)}%. No immediate action needed but watch weekly.`;
      } else {
        severity = 'low'; direction = 'up';
        signal = 'Pricing aligned with market';
        action = 'Hold current position';
        detail = `Gap is only ${absPct.toFixed(1)}% — pricing is competitive.`;
      }

      marketTrends.push({ item: name, change: gapStr, signal, action, actionDetail: detail, dir: direction, severity });
    }
  }

  // Sort revenue items descending by magnitude
  revenueItems.sort((a, b) => {
    return Math.abs(b.value) - Math.abs(a.value);
  });

  return {
    revenueItems: revenueItems.slice(0, 15),
    stockRiskItems,
    profitLeakItems,
    priorityActions,
    alertsFeed,
    profitOpportunities,
    marketComparison,
    marketTrends,
  };
}

export function buildInventoryBuckets(stats: ItemStat[]) {
  const buckets: Record<string, string[]> = {
    'Fast Moving': [],
    'Healthy': [],
    'Slow Moving': [],
    'Overstocked': [],
    'Dead Stock': [],
  };
  const colors: Record<string, string> = {
    'Fast Moving': 'jade',
    'Healthy': 'steel',
    'Slow Moving': 'yellow',
    'Overstocked': 'yellow',
    'Dead Stock': 'cinnabar',
  };

  for (const stat of stats) {
    const { name, dailyBurnRate, daysUntilEmpty } = stat;
    if (dailyBurnRate === 0)    buckets['Dead Stock'].push(name);
    else if (daysUntilEmpty < 14)   buckets['Fast Moving'].push(name);
    else if (daysUntilEmpty > 90)   buckets['Overstocked'].push(name);
    else if (daysUntilEmpty > 45)   buckets['Slow Moving'].push(name);
    else                            buckets['Healthy'].push(name);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, count: items.length, color: colors[label], items }));
}

export function buildSalesTimeline(
  salesRows: { sale_date: string; quantity_sold: number; sale_price: number }[]
): Record<string, { period: string; context: string; sales: number; target: number }[]> {
  if (salesRows.length === 0) return { days: [], weeks: [], months: [], years: [] };

  type Bucket = { sales: number };
  function aggregate(freqKey: (d: Date) => string, label: (d: Date) => string, context: (d: Date) => string) {
    const map = new Map<string, Bucket & { date: Date }>();
    for (const row of salesRows) {
      const d = new Date(row.sale_date);
      const key = freqKey(d);
      if (!map.has(key)) map.set(key, { sales: 0, date: d });
      map.get(key)!.sales += row.quantity_sold * row.sale_price;
    }
    const sorted = Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    const avg = sorted.reduce((a, b) => a + b.sales, 0) / (sorted.length || 1);
    return sorted.map(b => ({
      period: label(b.date),
      context: context(b.date),
      sales: Math.round(b.sales),
      target: Math.round(avg),
    }));
  }

  return {
    days:   aggregate(d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
                      d => String(d.getDate()),
                      d => d.toLocaleString('en', { month: 'long', year: 'numeric' })).slice(-14),

    weeks:  aggregate(d => { const w = new Date(d); w.setHours(0,0,0,0); w.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1)); return w.toISOString(); },
                      d => { const w = new Date(d); w.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1)); return `Wk ${Math.ceil(w.getDate()/7)}`; },
                      d => d.toLocaleString('en', { month: 'long', year: 'numeric' })).slice(-12),

    months: aggregate(d => `${d.getFullYear()}-${d.getMonth()}`,
                      d => d.toLocaleString('en', { month: 'short' }),
                      d => String(d.getFullYear())).slice(-12),

    years:  aggregate(d => String(d.getFullYear()),
                      d => String(d.getFullYear()),
                      () => '').slice(-10),
  };
}
