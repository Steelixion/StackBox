// src/lib/predictionContext.ts
import { supabaseAdmin } from './supabaseAdmin';

export interface PredictionContext {
  lastUpdated: string;
  kpis?: {
    revenueForecast: number;
    stockRiskItems: number;
    profitLeakItems: number;
  };
  relevantForecasts?: any[];
  marketPositions?: any[];
  inventoryHealth?: any;
}

/**
 * Clean interface for the RAG system to get predictive context without 
 * knowing anything about the pipeline, scraping, or the forecast algorithms.
 * 
 * @param query The user's chat query (used to filter relevant data)
 * @returns Structured predictive data relevant to the query
 */
export async function getPredictionContext(query: string): Promise<PredictionContext> {
  const { data: cacheRow, error } = await supabaseAdmin
    .from('app_cache')
    .select('data')
    .eq('id', 'predictive_dashboard')
    .single();

  if (error || !cacheRow || !cacheRow.data) {
    return { lastUpdated: 'No data available' };
  }

  const dbData = cacheRow.data as any;
  const q = query.toLowerCase();

  const result: PredictionContext = {
    lastUpdated: dbData.lastUpdated || new Date().toISOString(),
  };

  // KPI inclusion
  if (q.includes('kpi') || q.includes('profit') || q.includes('risk') || q.includes('summary')) {
    result.kpis = dbData.kpis;
  }

  // Inventory Health inclusion
  if (q.includes('stock') || q.includes('health') || q.includes('inventory')) {
    result.inventoryHealth = dbData.inventoryHealth;
  }

  // Forecast filtering
  if (dbData.forecasts && dbData.forecasts.length > 0) {
    const matchedForecasts = dbData.forecasts.filter((f: any) => q.includes(f.itemName.toLowerCase()));
    if (matchedForecasts.length > 0) {
      result.relevantForecasts = matchedForecasts;
    } else if (q.includes('forecast') || q.includes('prediction') || q.includes('future')) {
      // Return top 5 if explicitly asking for forecasts but no specific item match
      result.relevantForecasts = dbData.forecasts.slice(0, 5);
    }
  }

  // Market Position / Price filtering
  if (dbData.marketPositions && dbData.marketPositions.length > 0) {
    const matchedPositions = dbData.marketPositions.filter((m: any) => q.includes(m.name.toLowerCase()));
    if (matchedPositions.length > 0) {
      result.marketPositions = matchedPositions;
    } else if (q.includes('price') || q.includes('market') || q.includes('gap')) {
      result.marketPositions = dbData.marketPositions.slice(0, 5);
    }
  }

  return result;
}
