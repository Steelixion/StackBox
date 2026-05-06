'use server';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

export async function fetchTradingAlerts() {
  const { data } = await supabase
    .from('system_alerts')
    .select('*')
    .eq('severity', 'critical')
    .limit(5);
  return data || [];
}

export async function fetchRestockSuggestions() {
  const { data } = await supabase.from('restock_suggestions').select('*');
  return data || [];
}

export async function fetchDemandForecastData() {
  const { data } = await supabase.from('demand_forecasts').select('period, units').order('id', { ascending: true });
  return data || [];
}

export async function fetchValuationMetrics() {
  // Optimization: Only select what we need to reduce memory overhead
  const { data } = await supabase.from('items').select('count, cost_price, selling_price');

  const internalVal = data?.reduce((acc: number, i: any) => acc + (Number(i.count || 0) * Number(i.cost_price || 0)), 0) || 0;
  const marketVal = data?.reduce((acc: number, i: any) => acc + (Number(i.count || 0) * Number(i.selling_price || 0)), 0) || 0;

  const total = internalVal + marketVal;
  return {
    internal: internalVal,
    market: marketVal,
    internalPct: total > 0 ? Math.round((internalVal / total) * 100) : 50,
    marketPct: total > 0 ? Math.round((marketVal / total) * 100) : 50,
    arbitrage: internalVal > 0 ? Math.round(((marketVal - internalVal) / internalVal) * 100) : 0
  };
}

export async function dismissAlert(id: string) {
  await supabase.from('system_alerts').delete().eq('id', id);
  revalidatePath('/dashboard/predictions');
}

export async function approveRestockItem(id: number, userId: string) {
  const { data } = await supabase
    .from('restock_suggestions')
    .update({ approved: true, approved_by: userId, approved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return data;
}


export async function applyGlobalMatrixEngine() {
  await supabase.from('bundling_strategies').update({ applied: true }).eq('applied', false);
  revalidatePath('/dashboard/predictions');
  return true;
}

export async function fetchInventoryProducts() {
  const { data } = await supabase.from('items').select('name');
  return data?.map((item: any) => item.name) || [];
}

export async function fetchBundlingStrategies() {
  const { data } = await supabase
    .from('bundling_strategies')
    .select('*')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  return (data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    projectedMargin: `${b.discount_pct}%`,
    components: b.items_included ? (typeof b.items_included === 'string' ? JSON.parse(b.items_included) : b.items_included) : [],
    applied: b.is_active || false,
    updatedBy: b.created_by // Mapping to the schema's created_by field
  }));
}

export async function createManualBundle(payload: any, userId: string) {
  // Convert "+15%" string to numeric 15
  const numericMargin = parseInt(payload.projectedMargin.replace(/[^0-9]/g, '')) || 0;

  const { data, error } = await supabase
    .from('bundling_strategies')
    .insert([{
      name: payload.name,
      items_included: payload.components, // Supabase handles JSONB arrays automatically
      discount_pct: numericMargin,
      is_active: false,
      // Note: userId should be a valid UUID from auth.users to satisfy FK
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/predictions'); // Update based on your actual route
  return { success: true, data };
}

export async function toggleManualBundle(id: number, activeState: boolean) {
  const { error } = await supabase
    .from('bundling_strategies')
    .update({ is_active: activeState, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false };
  revalidatePath('/dashboard/predictions');
  return { success: true };
}

export async function deleteManualBundle(id: number) {
  // Soft delete as per common schema patterns, or hard delete:
  const { error } = await supabase
    .from('bundling_strategies')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) return { success: false };
  revalidatePath('/dashboard/predictions');
  return { success: true };
}
