'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchTradingAlerts,
  dismissAlert,
  fetchRestockSuggestions,
  approveRestockItem,
  fetchAcquisitionTargets,
  fetchBundlingStrategies,
} from '@/actions/inventory';
import type { TradingAlert, RestockSuggestion, AcquisitionTarget, BundlingStrategy } from '@/lib/db';

const CURRENT_USER = 'JDoe_MGR_77';

export default function InventoryTradingPage() {
  const [alerts, setAlerts] = useState<TradingAlert[]>([]);
  const [restockItems, setRestockItems] = useState<RestockSuggestion[]>([]);
  const [acquisitions, setAcquisitions] = useState<AcquisitionTarget[]>([]);
  const [bundles, setBundles] = useState<BundlingStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const pendingCount = restockItems.filter((r) => !r.approved).length;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [a, r, acq, b] = await Promise.all([
      fetchTradingAlerts(),
      fetchRestockSuggestions(),
      fetchAcquisitionTargets(),
      fetchBundlingStrategies(),
    ]);
    setAlerts(a);
    setRestockItems(r);
    setAcquisitions(acq);
    setBundles(b);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDismissAlert = async (id: number) => {
    setDismissingId(id);
    await dismissAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setDismissingId(null);
  };

  const handleApproveRestock = async (id: number) => {
    setApprovingId(id);
    const updated = await approveRestockItem(id, CURRENT_USER);
    if (updated) {
      setRestockItems((prev) => prev.map((r) => r.id === id ? updated : r));
    }
    setApprovingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-jade border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-steel font-mono">Loading trading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-deep-ink">Inventory Trading Hub</h1>
        <p className="text-steel text-sm mt-1">AI-driven market insights and automated inventory management</p>
      </div>

      {/* Top Section: Stock vs Market & Demand Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Stock vs. Market Widget */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-deep-ink">Stock vs. External Market</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-5 bg-porcelain/50 rounded-2xl">
              <p className="text-xs text-steel font-medium uppercase">Internal Stock Value</p>
              <p className="text-2xl font-bold text-deep-ink mt-2">$4.25M</p>
              <div className="flex items-center mt-3 text-xs text-jade">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                <span>Optimized Baseline</span>
              </div>
            </div>
            <div className="p-5 bg-porcelain/50 rounded-2xl">
              <p className="text-xs text-steel font-medium uppercase">Current Market Value</p>
              <p className="text-2xl font-bold text-deep-ink mt-2">$5.10M</p>
              <div className="flex items-center mt-3 text-xs text-jade">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                <span>+20% Arbitrage Potential</span>
              </div>
            </div>
          </div>

          <div className="relative h-12 w-full bg-porcelain rounded-lg overflow-hidden flex shadow-inner">
            <div className="absolute left-0 top-0 h-full bg-deep-ink w-[45%] flex items-center px-4 z-10 transition-all duration-1000">
              <span className="text-xs font-bold text-white tracking-wider">INTERNAL (45%)</span>
            </div>
            <div className="absolute right-0 top-0 h-full bg-jade/20 w-[55%] flex items-center justify-end px-4">
              <span className="text-xs font-bold text-jade tracking-wider">MARKET ARBITRAGE (55%)</span>
            </div>
          </div>
        </div>

        {/* 4. Demand Forecasting Widget */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-deep-ink">Demand Forecasting</h2>
            <select className="text-sm bg-porcelain border-none text-steel rounded focus:ring-0 cursor-pointer">
              <option>All Products</option>
              <option>High Margin</option>
            </select>
          </div>

          <div className="flex-1 w-full bg-deep-ink rounded-lg border border-steel/20 p-4 relative overflow-hidden flex items-end shadow-inner min-h-[180px]">
            <div className="absolute inset-0 flex flex-col justify-between py-4 opacity-10 pointer-events-none">
              <div className="w-full border-t border-porcelain"></div>
              <div className="w-full border-t border-porcelain"></div>
              <div className="w-full border-t border-porcelain"></div>
              <div className="w-full border-t border-porcelain"></div>
            </div>

            <div className="w-full h-full flex items-end justify-between space-x-2 px-2 relative z-10">
              <div className="flex flex-col items-center w-1/3">
                <div className="w-full bg-jade/40 hover:bg-jade/60 transition-colors rounded-t-sm h-[40%] flex justify-center group relative cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-white text-deep-ink text-xs py-1 px-2 rounded shadow font-bold transition-opacity">12k Units</div>
                </div>
                <span className="text-xs text-porcelain mt-2 font-mono">30 Days</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div className="w-full bg-jade/60 hover:bg-jade/80 transition-colors rounded-t-sm h-[65%] flex justify-center group relative cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-white text-deep-ink text-xs py-1 px-2 rounded shadow font-bold transition-opacity">18k Units</div>
                </div>
                <span className="text-xs text-porcelain mt-2 font-mono">60 Days</span>
              </div>
              <div className="flex flex-col items-center w-1/3">
                <div className="w-full bg-jade hover:bg-jade/90 shadow-[var(--drop-shadow-glow-jade)] transition-colors rounded-t-sm h-[90%] flex justify-center group relative cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-white text-deep-ink text-xs py-1 px-2 rounded shadow font-bold transition-opacity">25k Units</div>
                </div>
                <span className="text-xs text-porcelain mt-2 font-mono">90 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts & Warnings */}
        <div className="lg:col-span-1 space-y-6">

          {/* 2. AI Trading Alerts */}
          <div className="bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden h-[350px]">
            <div className="p-6 bg-white flex justify-between items-center shrink-0">
              <h2 className="text-sm font-bold text-deep-ink flex items-center">
                <svg className="w-4 h-4 mr-2 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Trading Alerts
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {alerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-steel opacity-50">
                  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-medium">All alerts triaged.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-xl bg-porcelain/30 hover:bg-porcelain/50 transition-colors group relative border border-transparent hover:border-steel/10">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-2">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${alert.type === 'sell' ? 'bg-jade shadow-[var(--drop-shadow-glow-jade)]' : 'bg-steel'}`}></div>
                        <div>
                          <p className="text-xs font-bold text-deep-ink">{alert.title}</p>
                          <p className="text-xs text-steel mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-steel/10">
                      <span className="text-xs text-steel/70 font-mono">{alert.time}</span>
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        disabled={dismissingId === alert.id}
                        className="text-xs font-bold text-steel hover:text-cinnabar transition-colors flex items-center opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        {dismissingId === alert.id ? '...' : 'DISMISS'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. Threshold & Expiry Warnings — static as these are computed thresholds */}
          <div className="bg-white rounded-2xl shadow-sm p-0 overflow-hidden text-deep-ink relative block h-[350px]">
            <div className="h-1 w-full bg-[#EAB308] flex" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }}></div>
            <div className="p-6 flex justify-between items-center shrink-0">
              <h2 className="text-sm font-bold flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#EAB308]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Threshold & Expiry
              </h2>
            </div>
            <div className="px-6 pb-6 pt-0 space-y-5 h-[calc(100%-60px)] overflow-y-auto">
              <div>
                <p className="text-[10px] text-steel font-bold tracking-widest uppercase mb-2">Low Stock (Sub-Dynamic Threshold)</p>
                <div className="flex justify-between items-center bg-porcelain/50 p-3 rounded-xl border border-steel/5">
                  <span className="text-xs font-bold text-deep-ink">Thermal Paste (T4)</span>
                  <span className="text-xs font-mono text-[#EAB308] font-bold">80 / 150 min</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-steel font-bold tracking-widest uppercase mb-2">Expiring (7 Days)</p>
                <div className="flex justify-between items-center bg-cinnabar/10 p-3 rounded-xl border border-cinnabar/20">
                  <span className="text-xs font-bold text-deep-ink">Industrial Adhesive</span>
                  <span className="text-[10px] bg-cinnabar px-1.5 py-0.5 rounded text-white font-bold">CRITICAL</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-steel font-bold tracking-widest uppercase mb-2">Expiring (15 Days)</p>
                <div className="flex justify-between items-center bg-[#EAB308]/10 p-3 rounded-xl border border-[#EAB308]/20">
                  <span className="text-xs font-bold text-deep-ink">Chemical Solvent (C2)</span>
                  <span className="text-xs text-[#EAB308] font-bold">12 Days</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-steel font-bold tracking-widest uppercase mb-2">Expiring (30 Days)</p>
                <div className="flex justify-between items-center bg-porcelain/50 p-3 rounded-xl border border-steel/5">
                  <span className="text-xs font-bold text-deep-ink">Paint Primer (P1)</span>
                  <span className="text-xs text-steel font-bold">28 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Approvals, Bundling, Acquisitions */}
        <div className="lg:col-span-2 space-y-6">

          {/* 6. Restocking & Approvals */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-deep-ink">Automated Restocking Pipeline</h2>
                <p className="text-xs text-steel mt-1">Pending manager approval for automated PO emails.</p>
              </div>
              <span className="text-xs font-mono bg-porcelain/50 px-3 py-1.5 rounded-lg text-deep-ink font-bold border border-steel/10">
                AWAITING: {pendingCount}
              </span>
            </div>

            <div className="px-6 pb-6">
              <div className="overflow-x-auto border border-steel/10 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-porcelain/30 text-xs font-bold text-steel/80 uppercase tracking-widest border-b border-steel/10">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Item / Supplier</th>
                      <th className="px-6 py-4 whitespace-nowrap">Suggested Qty</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel/10">
                    {restockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-porcelain/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-deep-ink">{item.item}</p>
                          <p className="text-xs text-steel">{item.supplier}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-steel line-through">{item.current}</span>
                            <span className="text-jade font-bold">→ {item.suggested}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-steel leading-relaxed min-w-[150px]">{item.reason}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {item.approved ? (
                            <div className="inline-flex flex-col items-end opacity-80">
                              <span className="text-[10px] font-bold text-jade bg-jade/10 px-2 py-1 rounded border border-jade/20 inline-flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                APPROVED
                              </span>
                              <span className="text-[10px] font-mono text-steel mt-1">{item.approvedBy}<br />{item.approvedAt ? new Date(item.approvedAt).toLocaleString() : ''}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApproveRestock(item.id)}
                              disabled={approvingId === item.id}
                              className="bg-deep-ink text-porcelain text-[11px] font-bold px-3 py-2 rounded hover:bg-jade hover:shadow-[var(--drop-shadow-glow-jade)] hover:text-deep-ink transition-all disabled:opacity-50"
                            >
                              {approvingId === item.id ? 'APPROVING...' : 'APPROVE EMAIL'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. Acquisition Suggestions Widget */}
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
              <h2 className="text-sm font-bold text-deep-ink mb-4">Market Acquisition Targets</h2>
              <div className="space-y-3 flex-1">
                {acquisitions.map((acq) => (
                  <div key={acq.id} className="p-4 bg-porcelain/40 rounded-xl relative overflow-hidden group border border-steel/5 hover:border-jade/30 transition-colors">
                    <div className="absolute top-0 right-0 h-full w-1 bg-jade opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-deep-ink">{acq.item}</p>
                      <span className="text-[10px] font-bold text-jade bg-jade/10 px-1.5 py-0.5 rounded border border-jade/20">{acq.trend}</span>
                    </div>
                    <p className="text-[10px] text-steel mt-2 uppercase font-bold tracking-wider">Suggested Action:</p>
                    <p className="text-xs font-medium text-deep-ink mt-0.5">{acq.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Pricing & Bundling Strategies */}
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col group/laser relative overflow-hidden">
              <div className="absolute left-0 right-0 h-[1px] bg-jade shadow-[var(--drop-shadow-glow-jade)] opacity-0 group-hover/laser:opacity-100 group-hover/laser:animate-[sweepLaser_2s_ease-in-out_infinite] z-20 pointer-events-none top-0" />
              <h2 className="text-sm font-bold text-deep-ink mb-4 flex items-center justify-between">
                Dynamic Bundling Engine
                <svg className="w-4 h-4 text-steel group-hover/laser:text-jade transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </h2>
              <div className="space-y-3">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="relative p-4 rounded-xl border border-steel/10 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-xs font-bold text-deep-ink uppercase tracking-wide">{bundle.name}</p>
                      <span className="text-[10px] font-bold text-jade bg-jade/10 px-1.5 py-0.5 rounded border border-jade/20">{bundle.projectedMargin} Margin</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {bundle.components.map((comp, idx) => (
                        <span key={idx} className="text-[10px] bg-porcelain px-2 py-1 rounded text-steel border border-steel/10 font-medium">{comp}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-auto pt-4 w-full bg-porcelain text-xs font-bold text-steel py-2.5 rounded border border-steel/10 hover:text-deep-ink hover:bg-white hover:border-jade hover:shadow-[var(--drop-shadow-glow-jade)] transition-all uppercase tracking-wider">
                Apply Global Matrix
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}