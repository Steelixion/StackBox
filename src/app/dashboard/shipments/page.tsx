'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchShipments,
  searchShipment,
  fetchQrCodes,
  printQrCode,
  generateNewQrBatch,
  createShipment,
  updateShipment,
  deleteShipment,
} from '@/actions/shipments';

// Interfaces defined locally to remove lib/db dependency
interface Shipment {
  id: string;
  product?: string;
  status: 'In-Stock' | 'In-Transit' | 'Delivered' | 'Pending';
  origin: string;
  destination: string;
  routing?: string;
  expectedArrival?: string;
  deliveredAt?: string;
  history?: { event: string; time: string }[];
}

interface QrCode {
  id: string;
  batch: string;
  item: string;
  qty: number;
  printed: boolean;
  details?: { name: string, qty: number }[];
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedShipment, setSearchedShipment] = useState<Shipment | 'NOT_FOUND' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [availableBoxes, setAvailableBoxes] = useState<any[]>([]);
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  const [batchingLoading, setBatchingLoading] = useState(false);

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [shipmentForm, setShipmentForm] = useState<Partial<Shipment>>({
    id: '',
    status: 'Pending',
    origin: '',
    destination: '',
    expectedArrival: '',
  });
  const [shipmentLoading, setShipmentLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { fetchEmployeeBoxes } = await import('@/actions/boxes');
      const [s, q, b] = await Promise.all([fetchShipments(), fetchQrCodes(), fetchEmployeeBoxes()]);
      setShipments(s as Shipment[]);
      setQrCodes(q as QrCode[]);
      setAvailableBoxes(b as any[]);
    } catch (error) {
      console.error("Failed to sync ledger:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  const getManifestData = (qr: QrCode) => {
    const itemsStr = qr.details?.map(d => `${d.name} (x${d.qty})`).join(', ') || qr.item;
    return `ID: ${qr.batch} | Items: ${itemsStr}`;
  };

  const handlePrint = async (qr: QrCode) => {
    setIsPrinting(qr.id);
    
    const manifest = getManifestData(qr);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(manifest)}`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Manifest QR - ${qr.batch}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'Inter', sans-serif; margin: 0; background: white; }
              .label-card { border: 2px solid black; padding: 40px; border-radius: 20px; display: flex; flex-direction: column; align-items: center; width: 450px; }
              img { width: 350px; height: 350px; margin-bottom: 30px; }
              .batch-id { font-size: 32px; font-weight: 900; margin: 0; font-family: monospace; }
              .manifest-list { margin-top: 20px; width: 100%; border-top: 1px solid #eee; pt: 20px; }
              .item-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; font-weight: 600; }
              @media print { body { height: auto; background: none; } .label-card { border: none; } }
            </style>
          </head>
          <body>
            <div class="label-card">
              <img src="${qrUrl}" onload="window.print(); window.close();" />
              <h1 class="batch-id">${qr.batch}</h1>
              <div class="manifest-list">
                ${qr.details?.map(d => '<div class="item-row"><span>' + d.name + '</span><span>x' + d.qty + '</span></div>').join('')}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    const { success } = await printQrCode(qr.id);
    if (success) {
      setQrCodes(prev => prev.map(q => q.id === qr.id ? { ...q, printed: true } : q));
    }
    setIsPrinting(null);
  };

  const handleCreateBatch = async () => {
    if (selectedBoxes.length === 0) return;
    setBatchingLoading(true);
    
    const boxesToBatch = availableBoxes.filter(b => selectedBoxes.includes(b.id));
    const allItems = boxesToBatch.flatMap(b => b.items.map((i: any) => ({ id: i.id, qty: i.count })));
    const boxLabels = boxesToBatch.map(b => b.box_label).join(', ');
    const summary = `${boxesToBatch.length} Boxes (${boxLabels})`;

    try {
      const newQr = await generateNewQrBatch(summary, allItems);
      setQrCodes(prev => [newQr as QrCode, ...prev]);
      setShowBatchModal(false);
      setSelectedBoxes([]);
    } catch (error) {
      alert("Failed to generate batch");
    } finally {
      setBatchingLoading(false);
    }
  };

  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setShipmentLoading(true);
    
    const payload = {
      id: shipmentForm.id!,
      origin: shipmentForm.origin!,
      destination: shipmentForm.destination!,
      status: shipmentForm.status!,
      estimated_arrival: shipmentForm.expectedArrival || new Date().toISOString(),
    };

    try {
      let result;
      if (editingShipment) {
        result = await updateShipment(editingShipment.id, payload);
      } else {
        result = await createShipment(payload);
      }

      if (result.success) {
        await loadData();
        setShowShipmentModal(false);
        setEditingShipment(null);
        setShipmentForm({ id: '', status: 'Pending', origin: '', destination: '', expectedArrival: '' });
      } else {
        alert("Operation failed: " + result.error);
      }
    } catch (err) {
      alert("An unexpected error occurred");
    } finally {
      setShipmentLoading(false);
    }
  };

  const handleDeleteShipment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipment?")) return;
    try {
      const result = await deleteShipment(id);
      if (result.success) {
        await loadData();
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      alert("Error deleting shipment");
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-jade border-t-transparent rounded-full animate-spin" />
      <p className="text-steel font-mono animate-pulse">Syncing Global Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-deep-ink">Shipment Tracking & Digital Identity</h1>
          <p className="text-steel text-sm mt-1 font-medium">Real-time movement tracking via Supabase.</p>
        </div>
        <button 
          onClick={() => {
            setEditingShipment(null);
            setShipmentForm({ id: 'TRK-' + Math.floor(Math.random()*10000), status: 'Pending', origin: '', destination: '', expectedArrival: '' });
            setShowShipmentModal(true);
          }}
          className="bg-jade text-deep-ink px-6 py-2.5 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-jade/10 uppercase tracking-widest flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Register Shipment
        </button>
      </header>

      {exceptions.length > 0 && (
        <div className="bg-cinnabar/5 border border-cinnabar/20 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-cinnabar"></div>
          <h2 className="text-lg font-bold text-cinnabar flex items-center mb-4">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cinnabar opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cinnabar"></span>
            </span>
            Critical Exceptions: {exceptions.length} Delayed Shipments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exceptions.map((exc) => (
              <div key={exc.id} className="bg-white p-4 rounded-xl border border-cinnabar/10 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                <div>
                  <span className="font-mono font-bold text-deep-ink text-xs">{exc.id}</span>
                  <p className="text-xs text-steel font-medium">{exc.product || 'Standard Freight'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-cinnabar uppercase tracking-widest bg-cinnabar/10 px-2 py-0.5 rounded">Overdue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-steel/10 flex flex-col h-full">
            <h2 className="text-lg font-bold mb-6 text-deep-ink flex items-center">
              <svg className="w-5 h-5 mr-2 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Identity Search
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Tracking ID or Scan Data..."
                className="flex-1 bg-porcelain border border-steel/20 rounded-xl px-4 py-3 text-sm focus:border-jade outline-none transition-all text-deep-ink"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button disabled={isSearching} className="bg-jade text-deep-ink px-6 py-3 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-jade/20 uppercase tracking-widest">
                {isSearching ? '...' : 'QUERY'}
              </button>
            </form>

            {searchedShipment && searchedShipment !== 'NOT_FOUND' && (
              <div className="mt-auto p-6 bg-porcelain/50 rounded-2xl border border-steel/5 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-steel uppercase tracking-widest">
                      {(searchedShipment as any).type === 'qr' ? 'Digital Manifest Identified' : 'Active Identity'}
                    </span>
                    <h3 className="text-lg font-bold text-deep-ink font-mono">{(searchedShipment as any).id}</h3>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${(searchedShipment as any).type === 'qr' ? 'bg-jade text-deep-ink' : 'bg-jade/10 text-jade border border-jade/20'}`}>
                    {(searchedShipment as any).status}
                  </span>
                </div>
                <div className="space-y-4">
                  {(searchedShipment as any).type === 'qr' ? (
                    <div>
                      <p className="text-[10px] text-steel uppercase font-bold tracking-wider opacity-60 mb-3">Manifest Contents</p>
                      <div className="space-y-2">
                        {(searchedShipment as any).items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-steel/5 shadow-sm">
                            <span className="text-sm font-bold text-deep-ink">{item.name}</span>
                            <span className="text-xs font-bold text-jade bg-jade/10 px-2 py-0.5 rounded-lg">x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-steel mt-4 italic">Assembled on {new Date((searchedShipment as any).createdAt).toLocaleString()}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] text-steel uppercase font-bold tracking-wider opacity-60">Transit Corridor</p>
                        <p className="text-sm font-bold text-deep-ink">{(searchedShipment as any).origin} <span className="text-jade mx-1">→</span> {(searchedShipment as any).destination}</p>
                      </div>
                      <div className="pt-4 border-t border-steel/10">
                        <p className="text-[10px] text-steel uppercase font-bold tracking-wider opacity-60 mb-3">Lifecycle Events</p>
                        {(searchedShipment as any).history && (searchedShipment as any).history.length > 0 ? (
                          <div className="space-y-3">
                            {(searchedShipment as any).history.slice(0, 3).map((h: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-[11px]">
                                <span className="text-deep-ink font-medium">• {h.event}</span>
                                <span className="text-steel font-mono opacity-80">{h.time}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-steel italic">Initial scan logged. No further events.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {searchedShipment === 'NOT_FOUND' && (
              <div className="mt-auto p-4 bg-cinnabar/5 border border-cinnabar/20 rounded-xl text-[11px] font-bold text-center text-cinnabar">
                ID not found in global ledger.
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-steel/10 overflow-hidden">
            <div className="p-8 border-b border-steel/5 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-lg font-bold text-deep-ink">Movement Ledger</h2>
                <p className="text-xs text-steel">Live synchronization with terminal gateways.</p>
              </div>
              <span className="text-[10px] bg-jade/10 text-jade px-3 py-1.5 rounded-xl font-bold border border-jade/20 shadow-sm">REAL-TIME SYNC</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-porcelain/30 text-steel uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="px-8 py-4 font-bold">Logistics ID</th>
                    <th className="px-8 py-4 font-bold">Status</th>
                    <th className="px-8 py-4 font-bold">Terminal ETA</th>
                    <th className="px-8 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel/5">
                  {shipments.map((s) => (
                    <tr key={s.id} className="group hover:bg-porcelain/20 transition-all">
                      <td className="px-8 py-6">
                        <p className="font-bold text-deep-ink text-sm font-mono tracking-tight">{s.id}</p>
                        <p className="text-steel text-[10px] font-medium">{s.product || `${s.origin} to ${s.destination}`}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ring-1 ${s.status === 'In-Transit' ? 'bg-amber-50 text-amber-600 ring-amber-100' :
                          s.status === 'Delivered' ? 'bg-jade/5 text-jade ring-jade/10' : 'bg-steel/5 text-steel ring-steel/10'
                          }`}>
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-mono text-steel font-bold">
                        {s.expectedArrival ? new Date(s.expectedArrival).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingShipment(s);
                              setShipmentForm({ ...s });
                              setShowShipmentModal(true);
                            }}
                            className="p-2 hover:bg-jade/10 text-steel hover:text-jade rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteShipment(s.id)}
                            className="p-2 hover:bg-cinnabar/10 text-steel hover:text-cinnabar rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-steel/10 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-bold text-deep-ink">Consolidated Batch Controls</h2>
                <p className="text-xs text-steel mt-1 font-medium">Generate digital identities for outbound batches.</p>
              </div>
              <button
                onClick={() => setShowBatchModal(true)}
                className="bg-deep-ink text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-jade hover:text-deep-ink transition-all shadow-xl shadow-deep-ink/10 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Batch
              </button>
            </div>
            
            {qrCodes.length === 0 ? (
              <div className="py-12 text-center bg-porcelain/30 rounded-2xl border border-dashed border-steel/20">
                <p className="text-sm text-steel font-medium">No active batches detected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {qrCodes.map((qr) => (
                  <div key={qr.id} className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-steel/10 shadow-sm hover:shadow-md transition-all group">
                    <div className="w-20 h-20 bg-white border-2 border-deep-ink p-1.5 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getManifestData(qr))}`} 
                        alt={`QR for ${qr.batch}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-deep-ink truncate group-hover:text-jade transition-colors">{qr.item}</p>
                      <p className="text-[11px] text-steel font-mono mt-1 font-bold">{qr.batch} <span className="mx-2 opacity-20">|</span> Qty: {qr.qty}</p>
                      <button
                        onClick={() => handlePrint(qr)}
                        disabled={isPrinting === qr.id}
                        className={`mt-4 text-[10px] font-bold px-4 py-1.5 rounded-lg border transition-all ${qr.printed ? 'bg-jade/10 border-jade/20 text-jade hover:bg-jade hover:text-deep-ink' : 'bg-deep-ink text-white border-deep-ink hover:bg-jade hover:text-deep-ink hover:border-jade shadow-lg shadow-deep-ink/5'}`}
                      >
                        {isPrinting === qr.id ? 'PRINTING...' : qr.printed ? 'REPRINT LABEL' : 'PRINT LABEL'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipment CRUD Modal */}
      {showShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20">
            <div className="p-8 border-b border-steel/10 flex justify-between items-center bg-porcelain/50">
              <div>
                <h2 className="text-xl font-bold text-deep-ink">{editingShipment ? 'Edit Shipment' : 'Register Shipment'}</h2>
                <p className="text-xs text-steel mt-1 font-medium">Log precise transit data to the global ledger.</p>
              </div>
              <button onClick={() => setShowShipmentModal(false)} className="text-steel hover:text-deep-ink transition-colors p-2 bg-white rounded-full shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveShipment} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-steel uppercase tracking-widest">Tracking ID</label>
                  <input 
                    required
                    disabled={!!editingShipment}
                    className="w-full bg-porcelain border border-steel/10 rounded-xl px-4 py-3 text-sm font-bold text-deep-ink outline-none focus:border-jade transition-all"
                    value={shipmentForm.id}
                    onChange={e => setShipmentForm({...shipmentForm, id: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-steel uppercase tracking-widest">Status</label>
                  <select 
                    className="w-full bg-porcelain border border-steel/10 rounded-xl px-4 py-3 text-sm font-bold text-deep-ink outline-none focus:border-jade transition-all"
                    value={shipmentForm.status}
                    onChange={e => setShipmentForm({...shipmentForm, status: e.target.value as any})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In-Transit">In-Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-steel uppercase tracking-widest">Origin</label>
                  <input 
                    required
                    placeholder="e.g. Hong Kong"
                    className="w-full bg-porcelain border border-steel/10 rounded-xl px-4 py-3 text-sm font-bold text-deep-ink outline-none focus:border-jade transition-all"
                    value={shipmentForm.origin}
                    onChange={e => setShipmentForm({...shipmentForm, origin: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-steel uppercase tracking-widest">Destination</label>
                  <input 
                    required
                    placeholder="e.g. London"
                    className="w-full bg-porcelain border border-steel/10 rounded-xl px-4 py-3 text-sm font-bold text-deep-ink outline-none focus:border-jade transition-all"
                    value={shipmentForm.destination}
                    onChange={e => setShipmentForm({...shipmentForm, destination: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-steel uppercase tracking-widest">Terminal ETA</label>
                <input 
                  type="datetime-local"
                  className="w-full bg-porcelain border border-steel/10 rounded-xl px-4 py-3 text-sm font-bold text-deep-ink outline-none focus:border-jade transition-all"
                  value={shipmentForm.expectedArrival ? new Date(shipmentForm.expectedArrival).toISOString().slice(0, 16) : ''}
                  onChange={e => setShipmentForm({...shipmentForm, expectedArrival: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setShowShipmentModal(false)}
                  className="px-6 py-2.5 text-xs font-bold text-steel hover:text-deep-ink uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  disabled={shipmentLoading}
                  className="px-8 py-2.5 bg-jade text-deep-ink font-bold rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-jade/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {shipmentLoading ? 'Syncing...' : editingShipment ? 'Update Transit' : 'Log Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
            <div className="p-8 border-b border-steel/10 flex justify-between items-center bg-porcelain/50">
              <div>
                <h2 className="text-xl font-bold text-deep-ink">Assemble Ship-Ready Batch</h2>
                <p className="text-xs text-steel mt-1 font-medium">Select employee boxes to consolidate into this batch.</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-steel hover:text-deep-ink transition-colors p-2 bg-white rounded-full shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {availableBoxes.length === 0 ? (
                <p className="text-center text-steel italic py-8">No employee boxes available for batching.</p>
              ) : (
                availableBoxes.map((box) => (
                  <label key={box.id} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selectedBoxes.includes(box.id) ? 'bg-jade/5 border-jade' : 'bg-porcelain border-steel/10 hover:border-jade/30'}`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg text-jade border-steel/30 focus:ring-jade/20"
                        checked={selectedBoxes.includes(box.id)}
                        onChange={() => {
                          setSelectedBoxes(prev => prev.includes(box.id) ? prev.filter(id => id !== box.id) : [...prev, box.id]);
                        }}
                      />
                      <div>
                        <p className="text-sm font-bold text-deep-ink">{box.box_label}</p>
                        <p className="text-[10px] text-steel font-medium uppercase tracking-tight">Logged by {box.warehouse_users?.full_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-deep-ink">{box.items.length} Items</p>
                      <p className="text-[10px] text-jade font-bold bg-jade/10 px-2 py-0.5 rounded-full inline-block mt-1">Ready</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="p-8 border-t border-steel/10 bg-porcelain/30 flex justify-end gap-4">
              <button 
                onClick={() => setShowBatchModal(false)}
                className="px-6 py-2.5 text-xs font-bold text-steel hover:text-deep-ink uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateBatch}
                disabled={selectedBoxes.length === 0 || batchingLoading}
                className="px-8 py-2.5 bg-jade text-deep-ink font-bold rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-jade/10 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
              >
                {batchingLoading ? 'Syncing...' : 'Seal & Generate Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}