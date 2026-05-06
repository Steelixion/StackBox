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
    // 1. Try searching shipments first
    const { data: shipment, error: sError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (shipment) {
      return {
        type: 'shipment',
        id: shipment.id,
        product: shipment.product || "Industrial Goods",
        status: shipment.status,
        origin: shipment.origin,
        destination: shipment.destination,
        routing: "Standard Freight",
        expectedArrival: shipment.estimated_arrival,
        history: shipment.history || [],
      };
    }

    // 2. If not found, search qr_codes
    const { data: qr, error: qError } = await supabase
      .from('qr_codes')
      .select(`
        id,
        batch,
        created_at,
        qr_code_items (
          quantity,
          items (name)
        )
      `)
      .eq('batch', id)
      .maybeSingle();

    if (qr) {
      const items = (qr.qr_code_items || []).map((qi: any) => ({
        name: qi.items?.name || "Unknown Item",
        qty: qi.quantity
      }));

      return {
        type: 'qr',
        id: qr.batch,
        status: 'In-Warehouse',
        origin: 'StackBox Terminal',
        destination: 'Outbound Pending',
        items: items,
        createdAt: qr.created_at
      };
    }

    return 'NOT_FOUND';
  } catch (error) {
    console.error("Search Error:", error);
    return 'NOT_FOUND';
  }
}

export async function fetchQrCodes() {
  try {
    // Join qr_codes with qr_code_items and items to get names
    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        qr_code_items (
          quantity,
          items (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((q: any) => ({
      batch: q.batch,
      item: q.item_name,
      qty: q.quantity,
      printed: q.is_printed
    }));
  } catch (error) {
    console.error("Fetch QR Error:", error);
    return [];
  }
}

export async function printQrCode(id: string) {
  try {
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_printed: true })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/dashboard/shipments');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function generateNewQrBatch(batchLabel: string, items: { id: number, qty: number }[]) {
  try {
    const batchId = `BCH-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // 1. Insert into qr_codes
    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .insert([{
        batch: batchId,
        is_printed: false,
      }])
      .select()
      .single();

    if (qrError) throw qrError;

    // 2. Insert into qr_code_items
    const qrCodeItems = items.map(item => ({
      qr_code_id: qrData.id,
      item_id: item.id,
      quantity: item.qty
    }));

    const { error: itemsError } = await supabase
      .from('qr_code_items')
      .insert(qrCodeItems);

    if (itemsError) throw itemsError;

    // Fetch the item names for the UI return
    const { data: fullItems } = await supabase
      .from('items')
      .select('name')
      .in('id', items.map(i => i.id));

    revalidatePath('/dashboard/shipments');
    
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    return {
      id: qrData.id,
      batch: qrData.batch,
      item: batchLabel,
      qty: totalQty,
      printed: false,
      details: items.map((item, idx) => ({ name: fullItems?.[idx]?.name || 'Item', qty: item.qty }))
    };
  } catch (error) {
    console.error("Batch Generation Error:", error);
    throw new Error("Failed to generate batch");
  }
}

export async function createShipment(data: { id: string, origin: string, destination: string, status: string, estimated_arrival: string }) {
  try {
    const { error } = await supabase
      .from('shipments')
      .insert([data]);

    if (error) throw error;
    revalidatePath('/dashboard/shipments');
    return { success: true };
  } catch (error) {
    console.error("Create Shipment Error:", error);
    return { success: false, error: (error as any).message };
  }
}

export async function updateShipment(id: string, data: Partial<{ origin: string, destination: string, status: string, estimated_arrival: string }>) {
  try {
    const { error } = await supabase
      .from('shipments')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/dashboard/shipments');
    return { success: true };
  } catch (error) {
    console.error("Update Shipment Error:", error);
    return { success: false, error: (error as any).message };
  }
}

export async function deleteShipment(id: string) {
  try {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/dashboard/shipments');
    return { success: true };
  } catch (error) {
    console.error("Delete Shipment Error:", error);
    return { success: false, error: (error as any).message };
  }
}