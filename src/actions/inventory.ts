'use server';
/**
 * @file src/actions/inventory.ts
 * Server Actions for the Inventory Trading module.
 */

import {
  getTradingAlerts,
  dismissTradingAlert,
  getRestockSuggestions,
  approveRestock,
  getAcquisitionTargets,
  getBundlingStrategies,
  type TradingAlert,
  type RestockSuggestion,
  type AcquisitionTarget,
  type BundlingStrategy,
} from '@/lib/db';

export async function fetchTradingAlerts(): Promise<TradingAlert[]> {
  return getTradingAlerts();
}

export async function dismissAlert(id: number): Promise<{ success: boolean }> {
  await dismissTradingAlert(id);
  return { success: true };
}

export async function fetchRestockSuggestions(): Promise<RestockSuggestion[]> {
  return getRestockSuggestions();
}

export async function approveRestockItem(
  id: number,
  userId: string
): Promise<RestockSuggestion | null> {
  return approveRestock(id, userId);
}

export async function fetchAcquisitionTargets(): Promise<AcquisitionTarget[]> {
  return getAcquisitionTargets();
}

export async function fetchBundlingStrategies(): Promise<BundlingStrategy[]> {
  return getBundlingStrategies();
}
