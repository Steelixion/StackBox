'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dismissDashboardAlert, fetchDashboardKPIs, fetchMarketGraphData, type DashboardKPIs } from '@/actions/dashboard';
import type { NotificationItem } from '@/lib/notifications-db';
import type { MarketGraphData } from '@/lib/db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [graphData, setGraphData] = useState<MarketGraphData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    const abs = Math.abs(num);
    if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.round(num).toString();
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [k, g] = await Promise.all([fetchDashboardKPIs(), fetchMarketGraphData()]);
    setKpis(k);
    setGraphData(g);

    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.notifications.filter((n: NotificationItem) => !n.read));
      }
    } catch {
      // fallback
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDismissAlert = async (id: string) => {
    setDismissingId(id);
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setDismissingId(null);
  };

  const alertDotColor = (level: NotificationItem['level']) => {
    if (level === 'info') return 'bg-jade shadow-[var(--drop-shadow-glow-jade)]';
    if (level === 'critical') return 'bg-cinnabar shadow-[var(--drop-shadow-glow-cinnabar)]';
    return 'bg-steel';
  };

  const alertItemBg = (level: NotificationItem['level']) => {
    if (level === 'critical') return 'bg-cinnabar/5 hover:bg-cinnabar/10';
    return 'bg-porcelain/30 hover:bg-porcelain/50';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep-ink">Dashboard Overview</h1>
          <p className="text-steel text-sm mt-1">Real-time insights and platform controls</p>
        </div>
      </div>

      {/* Real-time KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center space-x-6">
          <div className="w-12 h-12 rounded-lg bg-jade/10 text-jade flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-steel">Total Stock Units</p>
            <p className="text-2xl font-bold text-deep-ink mt-1">
              {isLoading ? <span className="inline-block w-20 h-7 bg-porcelain animate-pulse rounded" /> : kpis?.totalStockUnits.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center space-x-6">
          <div className="w-12 h-12 rounded-lg bg-deep-ink/5 text-deep-ink flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-steel">Active Shipments</p>
            <p className="text-2xl font-bold text-deep-ink mt-1">
              {isLoading ? <span className="inline-block w-16 h-7 bg-porcelain animate-pulse rounded" /> : kpis?.activeShipments}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center space-x-6 relative overflow-hidden group/laser">
          {/* EASTER EGG: Active OCR Laser */}
          <div className="absolute left-0 right-0 h-0.5 bg-jade shadow-[var(--drop-shadow-glow-jade)] opacity-0 group-hover/laser:opacity-100 group-hover/laser:animate-[sweepLaser_1.5s_ease-in-out_infinite] z-20 pointer-events-none top-0" />

          <div className="w-12 h-12 rounded-lg bg-cinnabar/10 text-cinnabar flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-steel">Pending Invoices</p>
            <p className="text-2xl font-bold text-deep-ink mt-1">
              {isLoading ? <span className="inline-block w-10 h-7 bg-porcelain animate-pulse rounded" /> : kpis?.pendingOcrInvoices}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Market vs. Internal Stock */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold text-deep-ink">Market vs. Internal Stock</h2>
              <button onClick={() => router.push('/dashboard/predictions')} className="text-sm font-medium text-jade hover:text-jade/80 transition-colors">View Deep Analysis</button>
            </div>

            {/* Chart */}
            <div className="w-full h-72 rounded-lg border border-steel/20 p-4 mt-6">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-porcelain animate-pulse rounded-lg text-steel text-sm">
                  Loading Market Vectors...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInternal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0B0F19" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0B0F19" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0B0F19', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="market" stroke="#0B0F19" strokeWidth={2} fillOpacity={1} fill="url(#colorMarket)" />
                    <Area type="monotone" dataKey="internal" stroke="#2DD4BF" strokeWidth={3} fillOpacity={1} fill="url(#colorInternal)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="p-6 bg-porcelain/40 rounded-2xl">
                <p className="text-xs text-steel font-medium uppercase">Internal Valuation</p>
                <p className="text-lg font-bold text-deep-ink mt-2">PKR {graphData.length > 0 ? formatNumber(graphData[graphData.length - 1].internal) : '0'}</p>
                <div className="flex items-center mt-3 text-xs text-steel">
                  <span>Live Database Valuation</span>
                </div>
              </div>
              <div className="p-6 bg-porcelain/40 rounded-2xl">
                <p className="text-xs text-steel font-medium uppercase">Current Market Valuation</p>
                <p className="text-lg font-bold text-deep-ink mt-2">PKR {graphData.length > 0 ? formatNumber(graphData[graphData.length - 1].market) : '0'}</p>
                <div className="flex items-center mt-3 text-xs text-steel">
                  <span>Live Market Average</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* Action Center */}
          <div className="bg-white rounded-2xl shadow-sm p-8 text-deep-ink relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-jade/20 rounded-full blur-[40px]" />

            <h2 className="text-lg font-bold text-deep-ink mb-4 relative z-10">Action Center</h2>
            <div className="space-y-4 relative z-10">
              <button onClick={() => router.push('/dashboard/invoices')} className="w-full flex items-center justify-between py-4 px-6 bg-porcelain hover:bg-porcelain/80 rounded-xl transition-colors group relative overflow-hidden group/laser">
                <div className="absolute left-0 right-0 h-[1px] bg-jade shadow-[var(--drop-shadow-glow-jade)] opacity-0 group-hover/laser:opacity-100 group-hover/laser:animate-[sweepLaser_1.2s_ease-in-out_infinite] z-20 pointer-events-none top-0" />
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-jade mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="font-medium text-sm">Upload Invoice</span>
                </div>
                <span className="text-xs text-jade group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button onClick={() => router.push('/dashboard/shipments')} className="w-full flex items-center justify-between py-4 px-6 bg-porcelain hover:bg-porcelain/80 rounded-xl transition-colors group">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-deep-ink mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className="font-medium text-sm">Generate QR Code</span>
                </div>
                <span className="text-xs text-deep-ink group-hover:translate-x-1 transition-transform">→</span>
              </button>

              {/* Pending Restocking KPI */}
              {!isLoading && kpis && kpis.pendingRestockApprovals > 0 && (
                <div className="flex items-center justify-between py-3 px-6 bg-[#EAB308]/10 rounded-xl border border-[#EAB308]/20">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#EAB308] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="font-medium text-sm text-deep-ink">{kpis.pendingRestockApprovals} Restocks Awaiting</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Alerts Panel */}
          <div className="bg-white rounded-2xl shadow-sm p-0 overflow-hidden flex flex-col min-h-[300px]">
            <div className="p-8 flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-deep-ink">Alerts & Notifications</h2>
              {!isLoading && alerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cinnabar/10 text-cinnabar text-xs font-bold">{alerts.length} New</span>
              )}
            </div>

            <div id="alerts-container" className="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-porcelain/30 animate-pulse h-16" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-steel/50">
                  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-medium">All clear — no active alerts.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-xl transition-colors group ${alertItemBg(alert.level)}`}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${alertDotColor(alert.level)}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${alert.level === 'critical' ? 'text-cinnabar-dark' : 'text-deep-ink'}`}>{alert.title}</p>
                        <p className="text-xs text-steel mt-0.5 leading-relaxed">{alert.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-steel/70 font-medium">{alert.timestamp}</p>
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            disabled={dismissingId === alert.id}
                            className="text-xs text-steel/50 hover:text-cinnabar transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                          >
                            {dismissingId === alert.id ? '...' : 'Dismiss'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-8 pb-8 pt-4">
              <button
                onClick={() => router.push('/dashboard/alerts')}
                className="w-full p-4 text-xs font-medium text-steel hover:text-deep-ink bg-porcelain/50 rounded-xl transition-colors"
              >
                View All Alerts & History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EASTER EGG: Matrix Rain Drop */}
      <div className="mt-8 h-32 w-full relative group/matrix flex justify-center items-end cursor-crosshair rounded-xl overflow-hidden border border-transparent hover:border-steel/10 transition-colors">
        <div className="text-steel/20 text-xs pb-2 font-mono tracking-widest uppercase transition-opacity duration-300 group-hover/matrix:opacity-0 mix-blend-difference">System Boundary</div>

        <div className="absolute inset-0 bg-deep-ink/5 opacity-0 group-hover/matrix:opacity-100 transition-opacity duration-700 pointer-events-none flex justify-between px-2 pt-2">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="text-jade/60 text-[10px] font-mono leading-none tracking-widest"
              style={{
                animation: `matrixFall ${1.5 + (i % 5) * 0.4}s linear infinite`,
                animationDelay: `${(i % 7) * 0.3}s`,
              }}
            >
              {['0', '1', '|', '||', '0', '1'][i % 6]}<br />
              {['1', '0', '||', '|', '1', '0'][i % 6]}<br />
              {['0', '1', '|', '||', '0', '1'][i % 6]}<br />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
