'use server';
/**
 * @file src/actions/traders.ts
 * Server Actions for the Client Management module.
 */

import { getTraders, getTraderById } from '@/lib/db';
import { type Trader } from '@/lib/schemas';

export async function fetchTraders(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ data: Trader[]; total: number }> {
  return getTraders(params);
}

export async function fetchTraderDetail(id: string): Promise<Trader | null> {
  return getTraderById(id);
}
