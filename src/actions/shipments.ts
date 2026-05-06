'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';


export async function fetchShipments() {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mapping based on your specific JSON:
    // "estimated_arrival" -> "expectedArrival"
    // Missing "product" -> Fallback to "Industrial Goods"
    return (data || []).map((s: any) => ({
      id: s.id,
      product: s.product || "Industrial Goods",
      status: s.status,
      origin: s.origin,
      destination: s.destination,
      routing: "Standard Freight",
      expectedArrival: s.estimated_arrival,
      history: s.history || [],
    }));
  } catch (error) {
    console.error("Action Error:", error);
    return [];
  }
}

export async function searchShipment(id: string) {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return 'NOT_FOUND';

    return {
      id: data.id,
      product: data.product || "Industrial Goods",
      status: data.status,
      origin: data.origin,
      destination: data.destination,
      routing: "Standard Freight",
      expectedArrival: data.estimated_arrival,
      history: data.history || [],
    };
  } catch (error) {
    return 'NOT_FOUND';
  }
}

export async function fetchQrCodes() {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((q: any) => ({
      batch: q.batch,
      item: q.item_name,
      qty: q.quantity,
      printed: q.is_printed
    }));
  } catch (error) {
    return [];
  }
}

export async function printQrCode(batch: string) {
  try {
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_printed: true })
      .eq('batch', batch);

    if (error) throw error;
    revalidatePath('/shipments');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function generateNewQrBatch(item: string, qty: number) {
  try {
    const batchId = `BCH-${Math.floor(Math.random() * 9000) + 1000}`;
    const { data, error } = await supabase
      .from('qr_codes')
      .insert([{
        batch: batchId,
        item_name: item,
        quantity: qty,
        is_printed: false,
      }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/shipments');
    return {
      batch: data.batch,
      item: data.item_name,
      qty: data.quantity,
      printed: data.is_printed,
    };
  } catch (error) {
    throw new Error("Failed to generate batch");
  }
}