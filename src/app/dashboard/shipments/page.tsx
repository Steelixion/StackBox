'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchShipments,
  searchShipment,
  fetchQrCodes,
  printQrCode,
  generateNewQrBatch,
} from '@/actions/shipments';
import type { Shipment, QrCode } from '@/lib/db';

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
    const [s, q] = await Promise.all([fetchShipments(), fetchQrCodes()]);
    setShipments(s);
    setQrCodes(q);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const currentTime = Date.now();
  const exceptions = shipments.filter((s) => {
    if (s.status !== 'In-Transit' || !s.expectedArrival) return false;
    return currentTime > new Date(s.expectedArrival).getTime();
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const result = await searchShipment(searchQuery.trim());
    setSearchedShipment(result);
    setIsSearching(false);
  };

  const handlePrint = async (batchId: string) => {
    setIsPrinting(batchId);
    await printQrCode(batchId);
    setQrCodes((prev) => prev.map((qr) => qr.batch === batchId ? { ...qr, printed: true } : qr));
    setIsPrinting(null);
  };

  const handleGenerateBatch = async () => {
    const items = ['Steel Sheets (S45)', 'Copper Rods (C12)', 'Industrial Bolts (B99)'];
    const item = items[Math.floor(Math.random() * items.length)];
    const qty = Math.floor(100 + Math.random() * 900);
    const newQr = await generateNewQrBatch(item, qty);
    setQrCodes((prev) => [newQr, ...prev]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-deep-ink">Shipment Tracking & Digital Identity</h1>
        <p className="text-steel text-sm mt-1">Real-time movement tracking and physical-to-digital anchoring.</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-40 bg-white rounded-2xl shadow-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-jade border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-steel font-mono">Loading shipment data...</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Exception Alerts */}
          {exceptions.length > 0 && (
            <div className="bg-cinnabar/10 border border-cinnabar/30 rounded-xl p-5 relative overflow-hidden group/alert">
              <div className="absolute top-0 left-0 w-full h-1 bg-cinnabar" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.2) 20px)' }}></div>
              <h2 className="text-lg font-bold text-cinnabar-dark flex items-center mb-3">
                <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Exception Alerts: Delayed Shipments
              </h2>
              <div className="space-y-2">
                {exceptions.map((exc) => (
                  <div key={exc.id} className="bg-white/60 p-3 rounded-lg border border-cinnabar/20 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-deep-ink mr-2">{exc.id}</span>
                      <span className="text-sm text-steel">{exc.product}</span>
                    </div>
                    <div className="text-right">
                      <p suppressHydrationWarning className="text-xs font-bold text-cinnabar uppercase tracking-wide">Expected: {new Date(exc.expectedArrival!).toLocaleDateString()}</p>
                      <p className="text-[10px] text-steel">Action required: Contact carrier</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Tracking Search & Details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-8 text-deep-ink relative overflow-hidden">
                {/* Neon glow top edge */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-jade shadow-[var(--drop-shadow-glow-jade)]"></div>

                <h2 className="text-lg font-bold mb-6">Digital Identity Search</h2>
                <form onSubmit={handleSearch} className="flex w-full space-x-2">
                  <input
                    type="text"
                    placeholder="Enter Tracking ID (e.g. TRK-118-C)"
                    className="flex-1 min-w-0 bg-porcelain border border-steel/20 rounded px-3 py-2 text-sm text-deep-ink placeholder-steel focus:outline-none focus:border-jade transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="shrink-0 bg-jade text-deep-ink px-4 py-2 rounded text-sm font-bold hover:shadow-[var(--drop-shadow-glow-jade)] transition-shadow disabled:opacity-50"
                  >
                    {isSearching ? '...' : 'QUERY'}
                  </button>
                </form>

                {/* Details Card */}
                {searchedShipment === 'NOT_FOUND' && (
                  <div className="mt-6 p-4 border border-cinnabar/30 bg-cinnabar/5 rounded text-center text-sm text-cinnabar">
                    Tracking ID not found in global ledger.
                  </div>
                )}

                {searchedShipment && searchedShipment !== 'NOT_FOUND' && (
                  <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-porcelain/40 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-xs text-steel uppercase font-mono tracking-widest">Tracking ID</p>
                          <p className="text-lg font-bold text-jade">{searchedShipment.id}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          searchedShipment.status === 'In-Transit' ? 'bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30' :
                          searchedShipment.status === 'Delivered' ? 'bg-jade/20 text-jade border border-jade/30' :
                          'bg-steel/20 text-deep-ink border border-steel/30'
                        }`}>
                          {searchedShipment.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-steel uppercase">Product</p>
                          <p className="text-sm font-medium">{searchedShipment.product}</p>
                        </div>
                        <div>
                          <p className="text-xs text-steel uppercase">Routing</p>
                          <p className="text-sm font-medium">{searchedShipment.routing}</p>
                        </div>
                        <div>
                          <p className="text-xs text-steel uppercase">Origin</p>
                          <p className="text-sm font-medium">{searchedShipment.origin}</p>
                        </div>
                        <div>
                          <p className="text-xs text-steel uppercase">Destination</p>
                          <p className="text-sm font-medium">{searchedShipment.destination}</p>
                        </div>
                      </div>

                      {/* Timeline History */}
                      <div className="mt-6 relative">
                        <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-steel/20"></div>
                        <div className="space-y-4 relative">
                          {searchedShipment.history.map((h, idx) => (
                            <div key={idx} className="flex items-start ml-5 relative">
                              <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-deep-ink border-2 border-jade shadow-[var(--drop-shadow-glow-jade)] z-10"></div>
                              <div>
                                <p className="text-xs font-bold text-deep-ink">{h.event}</p>
                                <p className="text-xs text-steel font-mono">{h.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              {/* Shipment Status Grid */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-8 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-deep-ink">Global Shipment Ledger</h2>
                  <div className="flex space-x-4">
                    <span className="flex items-center text-xs text-steel"><div className="w-2 h-2 rounded-full border border-steel mr-1.5"></div>In-Stock</span>
                    <span className="flex items-center text-xs text-steel"><div className="w-2 h-2 rounded-full bg-[#EAB308] mr-1.5"></div>In-Transit</span>
                    <span className="flex items-center text-xs text-steel"><div className="w-2 h-2 rounded-full bg-jade shadow-[var(--drop-shadow-glow-jade)] mr-1.5"></div>Delivered</span>
                  </div>
                </div>

                <div className="px-8 pb-8">
                  <div className="overflow-x-auto border border-steel/10 rounded-xl">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-porcelain/30 text-xs font-bold text-steel/80 uppercase tracking-widest border-b border-steel/10">
                        <tr>
                          <th className="px-6 py-4">Tracking ID / Product</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Route</th>
                          <th className="px-6 py-4 text-right">Delivery / ETA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipments.map((s) => (
                          <tr key={s.id} className="hover:bg-porcelain/30 transition-colors">
                            <td className="px-6 py-6">
                              <p className="font-bold text-deep-ink font-mono">{s.id}</p>
                              <p className="text-xs text-steel">{s.product}</p>
                            </td>
                            <td className="px-6 py-6">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                s.status === 'In-Transit' ? 'bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20' :
                                s.status === 'Delivered' ? 'bg-jade/10 text-jade border border-jade/20' :
                                'bg-steel/10 text-deep-ink border border-steel/20'
                              }`}>
                                {s.status === 'Delivered' && <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                {s.status}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-xs text-steel">
                              {s.origin} <br /> <span className="text-jade">→</span> {s.destination}
                            </td>
                            <td className="px-6 py-6 text-right">
                              {s.status === 'Delivered' ? (
                                <div className="inline-flex flex-col items-end">
                                  <span className="text-xs font-bold text-deep-ink">Delivered At:</span>
                                  <span suppressHydrationWarning className="text-xs font-mono text-steel bg-porcelain px-1.5 py-0.5 rounded border border-steel/10 mt-1">
                                    {new Date(s.deliveredAt!).toLocaleString()}
                                  </span>
                                </div>
                              ) : s.expectedArrival ? (
                                <div className="inline-flex flex-col items-end">
                                  <span className="text-xs text-steel">Est. Arrival:</span>
                                  <span suppressHydrationWarning className="text-xs font-medium text-deep-ink">
                                    {new Date(s.expectedArrival).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-steel text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* QR Code Management Module */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-8 flex justify-between items-center group/laser relative">
                  {/* Easter Egg Laser */}
                  <div className="absolute left-0 right-0 h-[1px] bg-jade shadow-[var(--drop-shadow-glow-jade)] opacity-0 group-hover/laser:opacity-100 group-hover/laser:animate-[sweepLaser_2s_ease-in-out_infinite] z-20 pointer-events-none top-0" />
                  <h2 className="text-lg font-bold text-deep-ink flex items-center">
                    <svg className="w-5 h-5 mr-2 text-deep-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    QR Code Management
                  </h2>
                  <button
                    onClick={handleGenerateBatch}
                    className="text-xs font-bold bg-jade text-deep-ink px-3 py-1.5 rounded hover:shadow-[var(--drop-shadow-glow-jade)] transition-shadow"
                  >
                    + Generate New Batch
                  </button>
                </div>

                <div className="px-8 pb-8 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {qrCodes.map((qr) => (
                    <div key={qr.batch} className="bg-porcelain/40 rounded-2xl p-6 flex flex-col items-center relative group">
                      <div className="absolute top-3 right-3">
                        {qr.printed && (
                          <span className="text-[10px] font-bold bg-steel/10 text-steel px-1.5 py-0.5 rounded uppercase border border-steel/20">Printed</span>
                        )}
                      </div>

                      {/* Simulated QR Code SVG */}
                      <div className="w-24 h-24 bg-white border-2 border-deep-ink p-1 mt-2 mb-4 relative z-10">
                        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#161C24_1px,_transparent_1px)] [background-size:4px_4px] relative">
                          <div className="absolute top-0 left-0 w-5 h-5 border-4 border-deep-ink"></div>
                          <div className="absolute top-0 right-0 w-5 h-5 border-4 border-deep-ink"></div>
                          <div className="absolute bottom-0 left-0 w-5 h-5 border-4 border-deep-ink"></div>
                        </div>
                      </div>

                      <div className="text-center w-full mb-4">
                        <p className="text-sm font-bold text-deep-ink font-mono">{qr.batch}</p>
                        <p className="text-xs text-steel line-clamp-1">{qr.item}</p>
                        <p className="text-xs text-steel/70 mt-1">Qty: {qr.qty}</p>
                      </div>

                      <button
                        onClick={() => handlePrint(qr.batch)}
                        disabled={qr.printed || isPrinting === qr.batch}
                        className={`w-full py-2 text-xs font-bold rounded transition-all ${
                          qr.printed
                            ? 'bg-porcelain text-steel cursor-not-allowed border border-steel/10'
                            : isPrinting === qr.batch
                            ? 'bg-jade/50 text-deep-ink cursor-wait'
                            : 'bg-deep-ink text-white hover:bg-jade hover:shadow-[var(--drop-shadow-glow-jade)] hover:text-deep-ink'
                        }`}
                      >
                        {qr.printed ? 'COPIES LOGGED' : isPrinting === qr.batch ? 'PRINTING...' : 'PRINT LABEL'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
