// src/app/api/pipeline/status/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: runLog } = await supabaseAdmin
      .from('prediction_pipeline_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (!runLog) {
      return NextResponse.json({
        isReady: false,
        itemsScraped: 0,
        itemsTotal: 0,
        lastUpdated: null,
      });
    }

    return NextResponse.json({
      isReady: runLog.is_cache_ready,
      itemsScraped: runLog.items_scraped,
      itemsTotal: runLog.items_total,
      lastUpdated: runLog.completed_at || runLog.started_at,
    });
  } catch (error: any) {
    console.error('[Pipeline Status API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
