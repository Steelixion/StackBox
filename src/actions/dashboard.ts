'use server';
/**
 * @file src/actions/dashboard.ts
 * Server Actions for the Dashboard Overview module.
 */

import {
  getSystemAlerts,
  dismissSystemAlert,
  getShipments,
  getInvoiceReviewQueue,
  getRestockSuggestions,
  getMarketGraphData,
  type SystemAlert,
  type MarketGraphData,
} from '@/lib/db';

export interface DashboardKPIs {
  totalStockUnits: number;
  activeShipments: number;
  pendingOcrInvoices: number;
  pendingRestockApprovals: number;
}

export async function fetchSystemAlerts(): Promise<SystemAlert[]> {
  return getSystemAlerts();
}

export async function dismissDashboardAlert(id: string): Promise<{ success: boolean }> {
  await dismissSystemAlert(id);
  return { success: true };
}

/**
 * Aggregates KPIs from real data collections.
 * In production: replace with optimized DB queries / aggregation pipelines.
 */
export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const [shipments, queue, restock] = await Promise.all([
    getShipments(),
    getInvoiceReviewQueue(),
    getRestockSuggestions(),
  ]);

  const activeShipments = shipments.filter((s) => s.status === 'In-Transit').length;
  const pendingApprovals = restock.filter((r) => !r.approved).length;

  return {
    totalStockUnits: 45231, // Would be a real DB SUM in production
    activeShipments,
    pendingOcrInvoices: queue.length,
    pendingRestockApprovals: pendingApprovals,
  };
}

export async function fetchMarketGraphData(): Promise<MarketGraphData[]> {
  return getMarketGraphData();
}
