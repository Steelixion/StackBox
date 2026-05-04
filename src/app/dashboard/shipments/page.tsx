'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchShipments,
  searchShipment,
  fetchQrCodes,
  printQrCode,
  generateNewQrBatch,
} from '@/actions/shipments';

// Interfaces defined locally to remove lib/db dependency
interface Shipment {
  id: string;
  product?: string; // Made optional to handle missing DB fields
  status: 'In-Stock' | 'In-Transit' | 'Delivered' | 'Pending';
  origin: string;
  destination: string;
  routing?: string;
  expectedArrival?: string;
  deliveredAt?: string;
  history?: { event: string; time: string }[];
}

interface QrCode {
  batch: string;
  item: string;
  qty: number;
  printed: boolean;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedShipment, setSearchedShipment] = useState<Shipment | 'NOT_FOUND' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, q] = await Promise.all([fetchShipments(), fetchQrCodes()]);
      // Ensure we cast the incoming data correctly
      setShipments(s as Shipment[]);
      setQrCodes(q as QrCode[]);

      console.log(s)
    } catch (error) {
      console.error("Failed to sync ledger:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Updated filter logic to handle the specific field name from your JSON
  const exceptions = shipments.filter((s) => {
    if (s.status !== 'In-Transit' || !s.expectedArrival) return false;
    return Date.now() > new Date(s.expectedArrival).getTime();
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const result = await searchShipment(searchQuery.trim());
    setSearchedShipment(result as Shipment | 'NOT_FOUND');
    setIsSearching(false);
  };

  const handlePrint = async (batchId: string) => {
    setIsPrinting(batchId);
    const { success } = await printQrCode(batchId);
    if (success) {
      setQrCodes(prev => prev.map(qr => qr.batch === batchId ? { ...qr, printed: true } : qr));
    }
    setIsPrinting(null);
  };

  const handleGenerateBatch = async () => {
    const items = ['Steel Sheets (S45)', 'Copper Rods (C12)', 'Industrial Bolts (B99)'];
    const item = items[Math.floor(Math.random() * items.length)];
    const qty = Math.floor(100 + Math.random() * 900);
    const newQr = await generateNewQrBatch(item, qty);
    setQrCodes(prev => [newQr as QrCode, ...prev]);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-jade border-t-transparent rounded-full animate-spin" />
      <p className="text-steel font-mono animate-pulse">Syncing Global Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <header>
        <h1 className="text-2xl font-bold text-deep-ink">Shipment Tracking & Digital Identity</h1>
        <p className="text-steel text-sm mt-1">Real-time movement tracking via Supabase.</p>
      </header>

      {/* Exception Alerts */}
      {exceptions.length > 0 && (
        <div className="bg-cinnabar/10 border border-cinnabar/30 rounded-xl p-5 border-l-4">
          <h2 className="text-lg font-bold text-cinnabar-dark flex items-center mb-3">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cinnabar opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cinnabar"></span>
            </span>
            Critical Exceptions: {exceptions.length} Delayed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exceptions.map((exc) => (
              <div key={exc.id} className="bg-white/80 p-3 rounded-lg border border-cinnabar/10 flex justify-between items-center shadow-sm">
                <div>
                  <span className="font-bold text-deep-ink">{exc.id}</span>
                  <p className="text-xs text-steel">{exc.product || 'Standard Freight'}</p>
                </div>
                <p className="text-xs font-bold text-cinnabar uppercase">Overdue</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-steel/10">
            <h2 className="text-lg font-bold mb-4">Identity Search</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Tracking ID..."
                className="flex-1 bg-porcelain border border-steel/20 rounded-lg px-3 py-2 text-sm focus:border-jade outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button disabled={isSearching} className="bg-jade text-deep-ink px-4 py-2 rounded-lg font-bold text-xs hover:brightness-110 disabled:opacity-50 transition-all">
                {isSearching ? '...' : 'QUERY'}
              </button>
            </form>

            {searchedShipment && searchedShipment !== 'NOT_FOUND' && (
              <div className="mt-6 p-4 bg-porcelain/40 rounded-xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-jade">{searchedShipment.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-jade/10 text-jade font-bold uppercase">{searchedShipment.status}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-steel uppercase font-bold">Location</p>
                    <p className="text-sm">{searchedShipment.origin} → {searchedShipment.destination}</p>
                  </div>
                  <div className="pt-2 border-t border-steel/10">
                    <p className="text-[10px] text-steel uppercase font-bold mb-2">History</p>
                    {searchedShipment.history && searchedShipment.history.length > 0 ? (
                      searchedShipment.history.slice(0, 3).map((h, i) => (
                        <div key={i} className="flex justify-between text-[11px] mb-1">
                          <span className="text-deep-ink">• {h.event}</span>
                          <span className="text-steel font-mono">{h.time}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-steel italic">No history available</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {searchedShipment === 'NOT_FOUND' && (
              <div className="mt-4 p-3 bg-cinnabar/5 border border-cinnabar/20 rounded-lg text-xs text-center text-cinnabar">
                ID not found in global ledger.
              </div>
            )}
          </div>
        </div>

        {/* Table & QR Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-steel/10 overflow-hidden">
            <div className="p-6 border-b border-steel/5 flex justify-between items-center">
              <h2 className="font-bold text-deep-ink">Shipment Ledger</h2>
              <span className="text-[10px] bg-jade/10 text-jade px-2 py-1 rounded-full font-bold">LIVE SYNC</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-porcelain/30 text-steel uppercase tracking-tighter">
                <tr>
                  <th className="p-4 font-bold">Logistics ID</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/5">
                {shipments.map((s) => (
                  <tr key={s.id} className="group hover:bg-porcelain/20 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-deep-ink">{s.id}</p>
                      <p className="text-steel text-[10px]">{s.product || `${s.origin} to ${s.destination}`}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.status === 'In-Transit' ? 'bg-amber-100 text-amber-700' :
                        s.status === 'Delivered' ? 'bg-jade/10 text-jade' : 'bg-steel/10 text-steel'
                        }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-steel">
                      {s.expectedArrival ? new Date(s.expectedArrival).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-steel/10 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-deep-ink">QR Batch Control</h2>
              <button
                onClick={handleGenerateBatch}
                className="bg-deep-ink text-white text-xs px-3 py-1.5 rounded-lg hover:bg-jade hover:text-deep-ink transition-all"
              >
                + New Batch
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {qrCodes.map((qr) => (
                <div key={qr.batch} className="flex items-center gap-4 p-4 bg-porcelain/30 rounded-xl border border-steel/5">
                  <div className="w-16 h-16 bg-white border border-deep-ink p-1 flex-shrink-0">
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#161C24_1px,_transparent_1px)] [background-size:4px_4px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{qr.item}</p>
                    <p className="text-[10px] text-steel font-mono">{qr.batch} | Qty: {qr.qty}</p>
                    <button
                      onClick={() => handlePrint(qr.batch)}
                      disabled={qr.printed || isPrinting === qr.batch}
                      className="mt-2 text-[10px] font-bold text-jade hover:underline disabled:text-steel transition-all"
                    >
                      {qr.printed ? 'LOGGED' : isPrinting === qr.batch ? 'PRINTING...' : 'PRINT LABEL'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}