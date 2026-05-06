// Reads cached dashboard payload from Supabase app_cache
// No Python proxy, no external service — direct DB read

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Fixed from SUPABASE_SERVICE_KEY
);

const REQUIRED_KEYS: Record<string, any> = {
  forecastItems: ['All Items'],
  forecastByItem: {},
  salesByRange: { days: [], weeks: [], months: [], years: [] },
  revenueItems: [],
  stockRiskItems: [],
  profitLeakItems: [],
  priorityActions: [],
  marketComparison: [],
  profitOpportunities: [],
  inventoryBuckets: [],
  marketTrends: [],
  alertsFeed: [],
};

export async function GET() {
  const { data, error } = await supabase
    .from('app_cache')
    .select('data, updated_at')
    .eq('id', 'predictive_dashboard')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Dashboard cache not found. Trigger /api/pipeline/forecast to generate it.' },
      { status: 404 }
    );
  }

  // Fill missing keys with safe defaults if a partial cache was written
  const payload = { ...data.data };
  for (const [key, defaultVal] of Object.entries(REQUIRED_KEYS)) {
    if (!(key in payload)) {
      payload[key] = defaultVal;
    }
  }
  payload.last_trained = data.updated_at;

  return NextResponse.json(payload);
}
