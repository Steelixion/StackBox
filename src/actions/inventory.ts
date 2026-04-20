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
  getDemandForecastData,
  applyAllBundlingStrategies,
  createBundlingStrategy,
  toggleBundlingStrategy,
  softDeleteBundlingStrategy,
  getInventoryProductNames,
  type TradingAlert,
  type RestockSuggestion,
  type AcquisitionTarget,
  type BundlingStrategy,
  type DemandForecastData,
} from '@/lib/db';

import { z } from 'zod';
import { BundleSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

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

export async function createManualBundle(
  formData: z.infer<typeof BundleSchema>,
  userId: string
): Promise<{ success: boolean; data?: BundlingStrategy; error?: string }> {
  try {
    const validated = BundleSchema.parse(formData);
    const result = await createBundlingStrategy({
      ...validated,
      createdBy: userId,
      updatedBy: userId,
    });
    revalidatePath('/dashboard/bundles');
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return { success: false, error: "Validation failed" };
  }
}

export async function toggleManualBundle(
  id: number,
  userId: string
): Promise<{ success: boolean }> {
  const result = await toggleBundlingStrategy(id, userId);
  if (result) {
    revalidatePath('/dashboard/bundles');
    return { success: true };
  }
  return { success: false };
}

export async function deleteManualBundle(
  id: number,
  userId: string
): Promise<{ success: boolean }> {
  const result = await softDeleteBundlingStrategy(id, userId);
  if (result) {
    revalidatePath('/dashboard/bundles');
    return { success: true };
  }
  return { success: false };
}

export async function applyGlobalMatrixEngine(): Promise<boolean> {
  return applyAllBundlingStrategies();
}

export async function fetchDemandForecastData(): Promise<DemandForecastData[]> {
  return getDemandForecastData();
}

export async function fetchInventoryProducts(): Promise<string[]> {
  return getInventoryProductNames();
}
