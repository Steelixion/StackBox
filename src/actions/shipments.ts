'use server';
/**
 * @file src/actions/shipments.ts
 * Server Actions for the Shipments module.
 * All functions are async and run on the server — safe to call directly from client components.
 */

import {
  findShipmentById,
  getQrCodes,
  getShipments,
  markQrCodePrinted,
  addQrCode,
  type Shipment,
  type QrCode,
} from '@/lib/db';

export async function fetchShipments(): Promise<Shipment[]> {
  return getShipments();
}

export async function searchShipment(
  id: string
): Promise<Shipment | 'NOT_FOUND'> {
  const shipment = await findShipmentById(id);
  return shipment ?? 'NOT_FOUND';
}

export async function fetchQrCodes(): Promise<QrCode[]> {
  return getQrCodes();
}

export async function printQrCode(batch: string): Promise<{ success: boolean }> {
  const result = await markQrCodePrinted(batch);
  return { success: result !== null };
}

export async function generateNewQrBatch(
  item: string,
  qty: number
): Promise<QrCode> {
  const batchNum = Math.floor(Math.random() * 900) + 100;
  return addQrCode({ batch: `BCH-${batchNum}`, item, qty });
}
