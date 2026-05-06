'use server';
import { supabase } from '@/lib/supabaseClient';

export async function fetchEmployeeBoxes() {
  const { data, error } = await supabase
    .from('boxes')
    .select(`
      id,
      box_label,
      created_at,
      created_by,
      warehouse_users (
        full_name,
        role,
        email
      ),
      items (
        id,
        name,
        count,
        description
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching boxes:', error);
    return [];
  }

  return data || [];
}

export async function createBox(boxLabel: string, createdBy: string) {
  const { data, error } = await supabase
    .from('boxes')
    .insert([{ box_label: boxLabel, created_by: createdBy }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function deleteBox(id: number) {
  const { error } = await supabase
    .from('boxes')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addItemToBox(boxId: number, itemData: { name: string, count: number, description?: string }) {
  const { data, error } = await supabase
    .from('items')
    .insert([{ ...itemData, box_id: boxId }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function deleteItem(id: number) {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
