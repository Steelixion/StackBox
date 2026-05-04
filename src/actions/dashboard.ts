'use server';

/**
 * @file src/actions/dashboard.ts
 * Server Actions using the exported Supabase Service Role client.
 */

import { supabase } from '@/lib/supabaseClient'; // Adjust path to your client file
import { revalidatePath } from 'next/cache';

export interface DashboardKPIs {
  totalStockUnits: number;
  activeShipments: number;
  pendingOcrInvoices: number;
  pendingRestockApprovals: number;
}

export async function fetchSystemAlerts() {
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch Alerts Error:', error);
    return [];
  }
  return data;
}

export async function dismissDashboardAlert(id: string): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('system_alerts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Aggregates KPIs using the Service Role client.
 */
export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  // Using .select('*', { count: 'exact', head: true }) is the most 
  // efficient way to get counts without downloading all row data.
  // Replace the stockData line in your fetchDashboardKPIs with:
  const [shipments, invoices, restocks, stockData] = await Promise.all([
    supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'In-Transit'),
    supabase.from('invoice_review_queue').select('*', { count: 'exact', head: true }),
    supabase.from('restock_suggestions').select('*', { count: 'exact', head: true }).eq('approved', false),
    supabase.from('items').select('count') // Table is 'items', column is 'count'
  ]);

  const totalStock = stockData.data?.reduce((acc, item) => acc + (item.count || 0), 0) || 0;
  return {
    totalStockUnits: totalStock,
    activeShipments: shipments.count || 0,
    pendingOcrInvoices: invoices.count || 0,
    pendingRestockApprovals: restocks.count || 0,
  };
}

export async function fetchMarketGraphData() {
  const { data, error } = await supabase
    .from('market_graph_data')
    .select('date, value, internal_value') // Added internal_value
    .order('date', { ascending: true });

  if (error) {
    console.error('Market Data Error:', error);
    return [];
  }

  // Map the DB columns to the keys used in your AreaChart (market and internal)
  return data.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    market: entry.value,
    internal: entry.internal_value
  }));
}