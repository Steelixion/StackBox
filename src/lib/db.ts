/**
 * @file src/lib/db.ts
 * @description Flexible JSON-based data access layer.
 * All public functions expose a stable API surface. Swap the fs/promises
 * implementation below for Prisma / Drizzle / Supabase without touching
 * any Server Action or UI code.
 */

import fs from 'fs/promises';
import path from 'path';

// ─── Path ──────────────────────────────────────────────────────────────────
const DB_PATH = path.join(process.cwd(), 'db.json');
const TRADERS_PATH = path.join(process.cwd(), 'traders.json');

import { z } from 'zod';
import { TraderSchema, type Trader } from './schemas';

// ─── Type Definitions ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
}

export interface ShipmentHistoryEntry {
  time: string;
  event: string;
}

export interface Shipment {
  id: string;
  product: string;
  status: 'In-Transit' | 'In-Stock' | 'Delivered';
  origin: string;
  destination: string;
  expectedArrival: string | null;
  deliveredAt: string | null;
  routing: string;
  history: ShipmentHistoryEntry[];
}

export interface QrCode {
  batch: string;
  item: string;
  qty: number;
  printed: boolean;
}

export interface InvoiceLineItem {
  item: string;
  qty: string;
  price: string;
}

export interface InvoiceReviewItem {
  id: string;
  vendor: string;
  confidence: number;
  raw: {
    vendor: string;
    lines: InvoiceLineItem[];
  };
  image: string;
  createdAt: string;
}

export interface InvoiceLedgerEntry {
  id: string;
  vendor: string;
  date: string;
  total: string;
  sync: boolean;
  lineItems: InvoiceLineItem[];
}

export interface TradingAlert {
  id: number;
  type: 'sell' | 'hold';
  title: string;
  message: string;
  time: string;
  dismissed: boolean;
}

export interface RestockSuggestion {
  id: number;
  item: string;
  current: number;
  suggested: number;
  reason: string;
  supplier: string;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface AcquisitionTarget {
  id: number;
  item: string;
  trend: string;
  action: string;
}

export interface BundlingStrategy {
  id: number;
  name: string;
  components: string[];
  projectedMargin: string;
  applied?: boolean;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
}

export interface SystemAlert {
  id: string;
  type: 'sell' | 'hold' | 'delay';
  title: string;
  message: string;
  time: string;
  dismissed: boolean;
}

export interface MarketGraphData {
  date: string;
  internal: number;
  market: number;
}

export interface DemandForecastData {
  period: string;
  units: number;
}

export interface DatabaseSchema {
  users: User[];
  shipments: Shipment[];
  qrCodes: QrCode[];
  invoiceReviewQueue: InvoiceReviewItem[];
  invoiceLedger: InvoiceLedgerEntry[];
  tradingAlerts: TradingAlert[];
  restockSuggestions: RestockSuggestion[];
  acquisitionTargets: AcquisitionTarget[];
  bundlingStrategies: BundlingStrategy[];
  systemAlerts: SystemAlert[];
  marketGraph: MarketGraphData[];
  demandForecast: DemandForecastData[];
}

// ─── Core Read / Write ──────────────────────────────────────────────────────

const DEFAULT_DB: DatabaseSchema = {
  users: [],
  shipments: [],
  qrCodes: [],
  invoiceReviewQueue: [],
  invoiceLedger: [],
  tradingAlerts: [],
  restockSuggestions: [],
  acquisitionTargets: [],
  bundlingStrategies: [],
  systemAlerts: [],
  marketGraph: [
    { date: 'Apr 01', internal: 4000, market: 4200 },
    { date: 'Apr 05', internal: 4100, market: 4400 },
    { date: 'Apr 10', internal: 4050, market: 4600 },
    { date: 'Apr 15', internal: 4250, market: 4500 },
    { date: 'Apr 20', internal: 4200, market: 5100 },
  ],
  demandForecast: [
    { period: '30 Days', units: 12000 },
    { period: '60 Days', units: 18000 },
    { period: '90 Days', units: 25000 },
  ]
};

export async function readDB(): Promise<DatabaseSchema> {
  try {
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return { ...DEFAULT_DB, ...JSON.parse(raw) } as DatabaseSchema;
  } catch (error) {
    console.error('[db] readDB failed:', error);
    return DEFAULT_DB;
  }
}

export async function writeDB(data: DatabaseSchema): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[db] writeDB failed:', error);
  }
}

// ─── User Repository ───────────────────────────────────────────────────────

export async function upsertUser(
  userInfo: Omit<User, 'id' | 'createdAt'>
): Promise<User> {
  const db = await readDB();
  let user = db.users.find((u) => u.email === userInfo.email);
  if (!user) {
    user = { id: crypto.randomUUID(), ...userInfo, createdAt: new Date().toISOString() };
    db.users.push(user);
    await writeDB(db);
  } else if (user.name !== userInfo.name || user.picture !== userInfo.picture) {
    user.name = userInfo.name;
    user.picture = userInfo.picture;
    await writeDB(db);
  }
  return user;
}

// ─── Shipment Repository ───────────────────────────────────────────────────

export async function getShipments(): Promise<Shipment[]> {
  const db = await readDB();
  return db.shipments;
}

export async function findShipmentById(id: string): Promise<Shipment | null> {
  const db = await readDB();
  return db.shipments.find((s) => s.id.toLowerCase() === id.toLowerCase()) ?? null;
}

export async function updateShipmentStatus(
  id: string,
  status: Shipment['status'],
  deliveredAt?: string
): Promise<Shipment | null> {
  const db = await readDB();
  const idx = db.shipments.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  db.shipments[idx] = {
    ...db.shipments[idx],
    status,
    ...(deliveredAt ? { deliveredAt } : {}),
  };
  await writeDB(db);
  return db.shipments[idx];
}

// ─── QR Code Repository ───────────────────────────────────────────────────

export async function getQrCodes(): Promise<QrCode[]> {
  const db = await readDB();
  return db.qrCodes;
}

export async function markQrCodePrinted(batch: string): Promise<QrCode | null> {
  const db = await readDB();
  const idx = db.qrCodes.findIndex((q) => q.batch === batch);
  if (idx === -1) return null;
  db.qrCodes[idx].printed = true;
  await writeDB(db);
  return db.qrCodes[idx];
}

export async function addQrCode(entry: Omit<QrCode, 'printed'>): Promise<QrCode> {
  const db = await readDB();
  const newQr: QrCode = { ...entry, printed: false };
  db.qrCodes.unshift(newQr);
  await writeDB(db);
  return newQr;
}

// ─── Invoice Repository ───────────────────────────────────────────────────

export async function getInvoiceReviewQueue(): Promise<InvoiceReviewItem[]> {
  const db = await readDB();
  return db.invoiceReviewQueue;
}

export async function getInvoiceLedger(): Promise<InvoiceLedgerEntry[]> {
  const db = await readDB();
  return db.invoiceLedger;
}

export async function addToInvoiceReviewQueue(
  item: InvoiceReviewItem
): Promise<InvoiceReviewItem> {
  const db = await readDB();
  db.invoiceReviewQueue.unshift(item);
  await writeDB(db);
  return item;
}

export async function syncInvoiceToLedger(
  invoiceId: string,
  vendor: string,
  lines: InvoiceLineItem[]
): Promise<InvoiceLedgerEntry> {
  const db = await readDB();
  // Remove from review queue
  db.invoiceReviewQueue = db.invoiceReviewQueue.filter((i) => i.id !== invoiceId);

  // Calculate total
  const totalNum = lines.reduce((acc, curr) => {
    const price = parseFloat(curr.price.replace(/[^0-9.]/g, '')) || 0;
    const qty = parseInt(curr.qty.replace(/[^0-9]/g, '')) || 0;
    return acc + price * qty;
  }, 0);

  const entry: InvoiceLedgerEntry = {
    id: invoiceId,
    vendor,
    date: new Date().toISOString().split('T')[0],
    total: `$${totalNum.toFixed(2)}`,
    sync: true,
    lineItems: lines,
  };
  db.invoiceLedger.unshift(entry);
  await writeDB(db);
  return entry;
}

export async function addHighConfidenceInvoiceToLedger(
  vendor: string
): Promise<InvoiceLedgerEntry> {
  const db = await readDB();
  const entry: InvoiceLedgerEntry = {
    id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    vendor,
    date: new Date().toISOString().split('T')[0],
    total: '$1,250.00',
    sync: true,
    lineItems: [],
  };
  db.invoiceLedger.unshift(entry);
  await writeDB(db);
  return entry;
}

// ─── Trading / Inventory Repository ──────────────────────────────────────

export async function getTradingAlerts(): Promise<TradingAlert[]> {
  const db = await readDB();
  return db.tradingAlerts.filter((a) => !a.dismissed);
}

export async function dismissTradingAlert(id: number): Promise<void> {
  const db = await readDB();
  const idx = db.tradingAlerts.findIndex((a) => a.id === id);
  if (idx !== -1) {
    db.tradingAlerts[idx].dismissed = true;
    await writeDB(db);
  }
}

export async function getRestockSuggestions(): Promise<RestockSuggestion[]> {
  const db = await readDB();
  return db.restockSuggestions;
}

export async function approveRestock(
  id: number,
  userId: string
): Promise<RestockSuggestion | null> {
  const db = await readDB();
  const idx = db.restockSuggestions.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  db.restockSuggestions[idx].approved = true;
  db.restockSuggestions[idx].approvedBy = userId;
  db.restockSuggestions[idx].approvedAt = new Date().toISOString();
  await writeDB(db);
  return db.restockSuggestions[idx];
}

export async function getAcquisitionTargets(): Promise<AcquisitionTarget[]> {
  const db = await readDB();
  return db.acquisitionTargets;
}

export async function getBundlingStrategies(): Promise<BundlingStrategy[]> {
  const db = await readDB();
  return db.bundlingStrategies.filter(b => !b.deletedAt);
}

export async function createBundlingStrategy(
  data: Omit<BundlingStrategy, 'id'>
): Promise<BundlingStrategy> {
  const db = await readDB();
  const maxId = db.bundlingStrategies.reduce((max, b) => Math.max(max, b.id), 0);
  const newBundle: BundlingStrategy = {
    ...data,
    id: maxId + 1,
    applied: false,
    deletedAt: null,
  };
  db.bundlingStrategies.unshift(newBundle);
  await writeDB(db);
  return newBundle;
}

export async function toggleBundlingStrategy(
  id: number,
  updatedBy: string
): Promise<BundlingStrategy | null> {
  const db = await readDB();
  const idx = db.bundlingStrategies.findIndex(b => b.id === id);
  if (idx === -1) return null;
  
  db.bundlingStrategies[idx] = {
    ...db.bundlingStrategies[idx],
    applied: !db.bundlingStrategies[idx].applied,
    updatedBy,
  };
  
  await writeDB(db);
  return db.bundlingStrategies[idx];
}

export async function softDeleteBundlingStrategy(
  id: number,
  updatedBy: string
): Promise<boolean> {
  const db = await readDB();
  const idx = db.bundlingStrategies.findIndex(b => b.id === id);
  if (idx === -1) return false;

  db.bundlingStrategies[idx] = {
    ...db.bundlingStrategies[idx],
    deletedAt: new Date().toISOString(),
    updatedBy,
  };
  
  await writeDB(db);
  return true;
}

export async function applyAllBundlingStrategies(): Promise<boolean> {
  const db = await readDB();
  let modified = false;
  db.bundlingStrategies = db.bundlingStrategies.map(bundle => {
    if (!bundle.applied) {
      modified = true;
      return { ...bundle, applied: true };
    }
    return bundle;
  });
  
  if (modified) {
    await writeDB(db);
  }
  return true;
}

// ─── System Alert Repository ──────────────────────────────────────────────

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  const db = await readDB();
  return db.systemAlerts.filter((a) => !a.dismissed);
}

export async function dismissSystemAlert(id: string): Promise<void> {
  const db = await readDB();
  const idx = db.systemAlerts.findIndex((a) => a.id === id);
  if (idx !== -1) {
    db.systemAlerts[idx].dismissed = true;
    await writeDB(db);
  }
}

// ─── Analytics & Graph Repositories ──────────────────────────────────────────────

export async function getMarketGraphData(): Promise<MarketGraphData[]> {
  const db = await readDB();
  return db.marketGraph || [];
}

export async function getDemandForecastData(): Promise<DemandForecastData[]> {
  const db = await readDB();
  return db.demandForecast || [];
}

/**
 * Aggregates unique product/item names from across the entire database.
 */
export async function getInventoryProductNames(): Promise<string[]> {
  const db = await readDB();
  const products = new Set<string>();

  db.shipments.forEach((s) => products.add(s.product));
  db.qrCodes.forEach((q) => products.add(q.item));
  db.restockSuggestions.forEach((r) => products.add(r.item));
  db.acquisitionTargets.forEach((a) => products.add(a.item));

  return Array.from(products).sort();
}

/**
 * ─── Trader Repository (Enterprise Standard) ──────────────────────────────────
 */

export async function getTraders(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ data: Trader[]; total: number }> {
  try {
    const raw = await fs.readFile(TRADERS_PATH, 'utf-8');
    const allTraders = JSON.parse(raw);
    
    // 1. Runtime Validation
    const validated = z.array(TraderSchema).parse(allTraders);
    
    // 2. Filtering
    let filtered = validated;
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.companyName.toLowerCase().includes(q) || 
        t.email.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(t => t.status === params.status);
    }

    const total = filtered.length;

    // 3. Pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const data = filtered.slice(offset, offset + limit);

    return { data, total };
  } catch (error) {
    console.error("Trader retrieval failed:", error);
    return { data: [], total: 0 };
  }
}

export async function getTraderById(id: string): Promise<Trader | null> {
  try {
    const raw = await fs.readFile(TRADERS_PATH, 'utf-8');
    const allTraders = JSON.parse(raw);
    const validated = z.array(TraderSchema).parse(allTraders);
    return validated.find(t => t.id === id) || null;
  } catch (error) {
    console.error(`Failed to fetch trader ${id}:`, error);
    return null;
  }
}
