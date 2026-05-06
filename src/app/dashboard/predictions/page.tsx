'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend } from 'recharts';
import { getUserProfile } from '@/actions/auth';

// --- Utility: Number Formatting ---
const formatNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num.replace(/[^0-9.-]+/g,"")) : num;
  if (isNaN(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
};

export default function PredictiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);
  const [role, setRole] = useState<string>('operator');
  const [loading, setLoading] = useState(true);

  // Chart Controls
  const [selectedItem, setSelectedItem] = useState<string>('All Items');
  const [forecastPeriod, setForecastPeriod] = useState<'days'|'weeks'|'months'|'years'>('days');
  const [chartType, setChartType] = useState<'area'|'bar'>('bar');
  
  // Dropdown States
  const [profitOpen, setProfitOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState(false);
  const [stockRiskOpen, setStockRiskOpen] = useState(false);
  const [leakOpen, setLeakOpen] = useState(false);

  // Modal State
  const [actionModal, setActionModal] = useState<{isOpen: boolean, item: any, suggestedPrice: number} | null>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openActionModal = (item: any, suggestedPrice: number) => {
    setActionModal({ isOpen: true, item, suggestedPrice });
    setCustomPrice(suggestedPrice.toString());
    setErrorMsg('');
  };

  // 1. Fetch Data & Role on Mount
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getUserProfile();
      if (profile) setRole(profile.role.toLowerCase());

      const res = await fetch('/api/predictions');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Poll Pipeline Status
  useEffect(() => {
    loadDashboard();
    const checkStatus = async () => {
      const res = await fetch('/api/pipeline/status');
      if (res.ok) setPipelineStatus(await res.json());
    };
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // 3. Action Handler (Optimistic UI + Server Call)
  const handlePriceAction = async () => {
    if (role !== 'owner') {
      setErrorMsg("You don't have permission to change prices. Contact the owner.");
      return;
    }
    if (!actionModal) return;

    const numericPrice = parseFloat(customPrice);
    if (isNaN(numericPrice)) {
      setErrorMsg("Please enter a valid number.");
      return;
    }

    const own = actionModal.item.ourPriceRaw;
    const market = actionModal.item.marketPriceRaw;

    if (own > market) {
      if (numericPrice < market || numericPrice > own) {
        setErrorMsg(`Price must be between ${market} and ${own}`);
        return;
      }
    } else {
      if (numericPrice < own || numericPrice > market) {
        setErrorMsg(`Price must be between ${own} and ${market}`);
        return;
      }
    }

    setActionLoading(true);
    try {
      const profile = await getUserProfile();
      const res = await fetch('/api/predictions/action', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: actionModal.item.id,
          field: 'selling_price',
          value: numericPrice,
          userId: profile?.id
        })
      });

      if (res.ok) {
        // Optimistic UI Update - Refresh full dashboard to recalculate all graphs
        await loadDashboard();
        setActionModal(null);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update price');
      }
    } catch (e) {
      setErrorMsg('Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="p-8 flex items-center justify-center min-h-[500px] text-steel">Loading Predictive Intelligence...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] bg-white rounded-2xl">
        <h2 className="text-xl font-bold text-deep-ink">No Predictive Data Available</h2>
        <p className="text-steel mt-2 text-center max-w-md">The predictive pipeline has not completed its first run yet.</p>
        {role === 'owner' && (
          <button onClick={() => fetch('/api/pipeline/forecast', { method: 'POST', headers: { 'x-pipeline-secret': process.env.NEXT_PUBLIC_PIPELINE_SECRET || '' } })} className="mt-6 px-4 py-2 bg-jade text-deep-ink font-bold rounded-lg hover:shadow-[var(--drop-shadow-glow-jade)] transition-all">
            Force Pipeline Trigger
          </button>
        )}
      </div>
    );
  }

  // Determine which forecast to show based on dropdown
  let activeForecast: any[] = [];
  if (selectedItem === 'All Items') {
    activeForecast = data.salesByRange?.[forecastPeriod] || [];
  } else {
    // For individual items, we use forecastByItem
    // forecast.ts output keys: 'days', 'weeks', 'months', 'years'
    activeForecast = data.forecastByItem?.[selectedItem]?.[forecastPeriod] || [];
  }

  const profitItems = data.revenueItems?.filter((r: any) => r.dir === 'up') || [];
  const lossItems = data.revenueItems?.filter((r: any) => r.dir === 'down') || [];
  const overpriced = data.marketComparison?.filter((p:any) => p.gapRaw > 0 && !p.isAggregate) || [];
  const underpriced = data.marketComparison?.filter((p:any) => p.gapRaw < 0 && !p.isAggregate) || [];
  const totalProfit = profitItems.reduce((acc: number, item: any) => acc + item.value, 0);
  const totalLoss = lossItems.reduce((acc: number, item: any) => acc + Math.abs(item.value), 0);
  const netRevenue = totalProfit - totalLoss;

  const criticalRisks = data.stockRiskItems?.filter((i:any) => i.level === 'critical') || [];
  const warningRisks = data.stockRiskItems?.filter((i:any) => i.level === 'warning') || [];
  const topLeak = data.profitLeakItems?.[0];

  const chartData = activeForecast.map((item: any, index: number) => {
    let showContext = false;
    if (index === 0 || activeForecast[index - 1].context !== item.context) {
      showContext = true;
    }
    return {
      ...item,
      displayContext: showContext ? item.context : ''
    };
  });

  return (
    <div className="space-y-6 pb-20 relative">
      {(profitOpen || lossOpen || stockRiskOpen || leakOpen) && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => { setProfitOpen(false); setLossOpen(false); setStockRiskOpen(false); setLeakOpen(false); }} 
        />
      )}
      {/* --- Section 1: Header + Status Bar --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-deep-ink">Predictive Intelligence</h1>
          <p className="text-steel text-sm mt-1">AI-driven forecasts and automated market positioning</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-steel/10">
            <div className="w-2 h-2 rounded-full bg-jade shadow-[var(--drop-shadow-glow-jade)] animate-pulse" />
            <span className="text-xs font-bold text-deep-ink">Model Active</span>
            <span className="text-xs text-steel border-l border-steel/20 pl-2 ml-2">Confidence: 89%</span>
            <span className="text-xs text-steel border-l border-steel/20 pl-2 ml-2">
              Updated {new Date(data.last_trained).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {!pipelineStatus?.isReady && pipelineStatus?.itemsTotal > 0 && (
             <div className="text-xs font-medium text-steel">
               Collecting market data... ({pipelineStatus.itemsScraped} / {pipelineStatus.itemsTotal} items)
             </div>
          )}
        </div>
      </div>

      {/* --- Section 2: Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* --- Card 1: Revenue Forecast --- */}
        <div className={`bg-white rounded-2xl shadow-sm border border-steel/10 flex flex-col transition-all duration-300 hover:shadow-md relative ${profitOpen || lossOpen ? 'z-50' : 'z-10'}`}>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-sm font-medium text-steel">30-Day Net Revenue Forecast</p>
            <p className="text-3xl font-bold text-deep-ink mt-2">PKR {formatNumber(netRevenue)}</p>
            
            <div className="flex space-x-4 mt-auto pt-6">
              <div className="flex-1 p-3 bg-jade/10 rounded-xl">
                <p className="text-[10px] text-jade font-bold uppercase mb-1">Total Profit</p>
                <p className="text-lg font-bold text-deep-ink">+{formatNumber(totalProfit)}</p>
              </div>
              <div className="flex-1 p-3 bg-cinnabar/10 rounded-xl">
                <p className="text-[10px] text-cinnabar font-bold uppercase mb-1">Total Loss</p>
                <p className="text-lg font-bold text-deep-ink">-{formatNumber(totalLoss)}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-steel/10 bg-porcelain/30 rounded-b-2xl relative">
             <button onClick={() => {setProfitOpen(!profitOpen); setLossOpen(false);}} className={`w-full px-6 py-3 flex justify-between items-center text-sm font-bold text-jade hover:bg-porcelain/50 transition-colors ${lossOpen ? 'border-b border-steel/10' : ''}`}>
               <span>Profit Contributors ({profitItems.length})</span>
               <span>{profitOpen ? '▲' : '▼'}</span>
             </button>
             {profitOpen && (
               <div className="absolute top-full left-0 w-full mt-2 bg-white border border-steel/10 shadow-2xl rounded-xl z-50 px-6 pb-4 pt-2 max-h-60 overflow-y-auto space-y-2">
                 {profitItems.map((item: any, i: number) => (
                   <div key={i} className="flex justify-between text-xs border-b border-steel/10 pb-1 mt-2">
                     <span className="text-deep-ink font-medium">{item.name}</span>
                     <span className="text-jade font-bold">{item.impact}</span>
                   </div>
                 ))}
                 {profitItems.length === 0 && <span className="text-xs text-steel mt-2 block">No profit items found.</span>}
               </div>
             )}
             
             <button onClick={() => {setLossOpen(!lossOpen); setProfitOpen(false);}} className="w-full px-6 py-3 flex justify-between items-center text-sm font-bold text-cinnabar hover:bg-porcelain/50 border-t border-steel/10 transition-colors rounded-b-2xl">
               <span>Loss Contributors ({lossItems.length})</span>
               <span>{lossOpen ? '▲' : '▼'}</span>
             </button>
             {lossOpen && (
               <div className="absolute top-full left-0 w-full mt-2 bg-white border border-steel/10 shadow-2xl rounded-xl z-50 px-6 pb-4 pt-2 max-h-60 overflow-y-auto space-y-2">
                 {lossItems.map((item: any, i: number) => (
                   <div key={i} className="flex justify-between text-xs border-b border-steel/10 pb-1 mt-2">
                     <span className="text-deep-ink font-medium">{item.name}</span>
                     <span className="text-cinnabar font-bold">{item.impact}</span>
                   </div>
                 ))}
                 {lossItems.length === 0 && <span className="text-xs text-steel mt-2 block">No loss items found.</span>}
               </div>
             )}
          </div>
        </div>

        {/* --- Card 2: Stock Risk Warnings --- */}
        <div className={`bg-white rounded-2xl shadow-sm border border-steel/10 flex flex-col transition-all duration-300 hover:shadow-md relative ${stockRiskOpen ? 'z-50' : 'z-10'}`}>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-sm font-medium text-steel">Stock Risk Warnings</p>
            <p className="text-3xl font-bold text-deep-ink mt-2">{data.stockRiskItems?.length || 0}</p>
            
            <div className="flex space-x-4 mt-auto pt-6">
              <div className="flex-1 p-3 bg-cinnabar/10 rounded-xl">
                <p className="text-[10px] text-cinnabar font-bold uppercase mb-1">Ended / Critical</p>
                <p className="text-lg font-bold text-deep-ink">{criticalRisks.length}</p>
              </div>
              <div className="flex-1 p-3 bg-[#FEF3C7] rounded-xl">
                <p className="text-[10px] text-[#B45309] font-bold uppercase mb-1">Soon Ending</p>
                <p className="text-lg font-bold text-deep-ink">{warningRisks.length}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-steel/10 bg-porcelain/30 rounded-b-2xl relative">
             <button onClick={() => setStockRiskOpen(!stockRiskOpen)} className="w-full px-6 py-3 flex justify-between items-center text-sm font-bold text-deep-ink hover:bg-porcelain/50 transition-colors rounded-b-2xl">
               <span>View Details</span>
               <span>{stockRiskOpen ? '▲' : '▼'}</span>
             </button>
             {stockRiskOpen && (
               <div className="absolute top-full left-0 w-full mt-2 bg-white border border-steel/10 shadow-2xl rounded-xl z-50 px-6 pb-4 pt-2 max-h-60 overflow-y-auto space-y-3">
                 {data.stockRiskItems?.map((item: any, i: number) => (
                   <div key={i} className="flex flex-col text-xs border-b border-steel/10 pb-2 mt-2">
                     <span className="font-bold text-deep-ink">{item.name}</span>
                     <div className="flex justify-between items-center mt-1">
                       <span className={`px-2 py-0.5 rounded-full font-bold ${item.level === 'critical' ? 'bg-cinnabar/10 text-cinnabar' : 'bg-yellow-100 text-yellow-700'}`}>
                         {item.status === 'Out of stock' ? 'Ended' : 'Soon Ending'}
                       </span>
                       <span className="text-steel font-medium">Est: {Math.floor(item.daysUntilEmpty)} days</span>
                     </div>
                   </div>
                 ))}
                 {data.stockRiskItems?.length === 0 && <span className="text-xs text-steel mt-2 block">No risks currently.</span>}
               </div>
             )}
          </div>
        </div>

        {/* --- Card 3: Profit Leak Indicators --- */}
        <div className={`bg-white rounded-2xl shadow-sm border border-steel/10 flex flex-col transition-all duration-300 hover:shadow-md relative ${leakOpen ? 'z-50' : 'z-10'}`}>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-sm font-medium text-steel">Profit Leak Indicators</p>
            <p className="text-3xl font-bold text-deep-ink mt-2">{data.profitLeakItems?.length || 0}</p>
            
            <div className="flex space-x-4 mt-auto pt-6">
              <div className="flex-1 p-3 bg-porcelain rounded-xl">
                <p className="text-[10px] text-steel font-bold uppercase mb-1">Top Leaking Item</p>
                <p className="text-sm font-bold text-deep-ink truncate">{topLeak ? topLeak.name : 'None'}</p>
              </div>
              <div className="flex-1 p-3 bg-[#FEF3C7] rounded-xl">
                <p className="text-[10px] text-[#B45309] font-bold uppercase mb-1">Daily Loss</p>
                <p className="text-sm font-bold text-deep-ink truncate">{topLeak ? topLeak.loss : '0 PKR/day'}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-steel/10 bg-porcelain/30 rounded-b-2xl relative">
             <button onClick={() => setLeakOpen(!leakOpen)} className="w-full px-6 py-3 flex justify-between items-center text-sm font-bold text-deep-ink hover:bg-porcelain/50 transition-colors rounded-b-2xl">
               <span>View All Affected ({data.profitLeakItems?.length || 0})</span>
               <span>{leakOpen ? '▲' : '▼'}</span>
             </button>
             {leakOpen && (
               <div className="absolute top-full left-0 w-full mt-2 bg-white border border-steel/10 shadow-2xl rounded-xl z-50 px-6 pb-4 pt-2 max-h-60 overflow-y-auto space-y-2">
                 {data.profitLeakItems?.map((item: any, i: number) => (
                    <div key={i} className="text-xs flex justify-between border-b border-steel/10 pb-1 mt-2">
                      <span className="text-deep-ink truncate mr-2" title={item.name}>{item.name}</span>
                      <span className="text-cinnabar font-bold whitespace-nowrap">{item.loss}</span>
                    </div>
                 ))}
                 {data.profitLeakItems?.length === 0 && <span className="text-xs text-steel mt-2 block">No profit leaks found.</span>}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* --- Section 3: Demand Horizon Chart --- */}
      <div className="bg-deep-ink rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 z-10 relative">
          <h2 className="text-lg font-bold text-porcelain">Demand Horizon</h2>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div className="flex bg-deep-ink-light rounded-lg p-1 border border-steel/20">
              <button onClick={() => setChartType('area')} className={`px-3 py-1 text-xs rounded-md font-bold transition-colors ${chartType === 'area' ? 'bg-jade text-deep-ink' : 'text-steel hover:text-porcelain'}`}>Line</button>
              <button onClick={() => setChartType('bar')} className={`px-3 py-1 text-xs rounded-md font-bold transition-colors ${chartType === 'bar' ? 'bg-jade text-deep-ink' : 'text-steel hover:text-porcelain'}`}>Bar</button>
            </div>
            <select 
              value={selectedItem} 
              onChange={(e) => setSelectedItem(e.target.value)}
              className="bg-deep-ink-light text-porcelain border border-steel/30 rounded-lg px-3 py-1.5 text-sm outline-none"
            >
              {Array.from(new Set(data.forecastItems || [])).map((name: any) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div className="flex bg-deep-ink-light rounded-lg p-1 border border-steel/20">
              {['days', 'weeks', 'months', 'years'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setForecastPeriod(p as any)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${forecastPeriod === p ? 'bg-jade text-deep-ink font-bold' : 'text-steel hover:text-porcelain'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-80 z-10 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 30, left: 0 }}>
              <defs>
                <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              {/* Display primary period (e.g. date) as tick */}
              <XAxis 
                dataKey={selectedItem === 'All Items' ? 'period' : 'date'} 
                stroke="#94A3B8" 
                tick={{fontSize: 12}} 
                tickMargin={10}
              />
              {/* Secondary XAxis just for showing context cleanly */}
              <XAxis 
                xAxisId="context" 
                dataKey="displayContext" 
                axisLine={false} 
                tickLine={false} 
                stroke="#64748B" 
                tick={{fontSize: 10, fontWeight: 'bold'}} 
                orientation="bottom" 
                /* removed invalid yAxisId */
                tickMargin={25}
              />
              <YAxis stroke="#94A3B8" tick={{fontSize: 12}} tickFormatter={(val) => formatNumber(val)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }} 
                itemStyle={{ color: '#F8FAFC' }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.context ? `${label} (${payload[0].payload.context})` : label}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {chartType === 'bar' ? (
                selectedItem === 'All Items' ? (
                  <>
                    <Bar dataKey="sales" fill="#2DD4BF" name="Total Sales" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeWidth={2} name="Average Baseline" dot={false} strokeDasharray="5 5" />
                  </>
                ) : (
                  <>
                    <Bar dataKey="actual" fill="#94A3B8" name="Actual Sales" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="predicted" fill="#2DD4BF" name="Predicted Demand" radius={[4, 4, 0, 0]} />
                  </>
                )
              ) : (
                selectedItem === 'All Items' ? (
                  <>
                    <Area type="monotone" dataKey="sales" stroke="#2DD4BF" fill="url(#colorMargin)" name="Total Sales" />
                    <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeWidth={2} name="Average Baseline" dot={false} strokeDasharray="5 5" />
                  </>
                ) : (
                  <>
                    <Area type="monotone" dataKey="high" stroke="none" fill="url(#colorMargin)" name="Confidence Band" />
                    <Area type="monotone" dataKey="low" stroke="none" fill="#161C24" fillOpacity={1} />
                    <Line type="monotone" dataKey="actual" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" name="Actual Sales" dot={true} />
                    <Line type="monotone" dataKey="predicted" stroke="#2DD4BF" strokeWidth={3} name="Predicted Demand" dot={false} />
                  </>
                )
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Section 4: Market vs Our Position Tables --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Above Market (Overpriced) */}
        <div className="bg-white rounded-2xl shadow-sm border border-steel/10 overflow-hidden">
          <div className="p-6 border-b border-steel/10 bg-porcelain/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-deep-ink">Overpriced Items</h2>
            <span className="px-3 py-1 bg-cinnabar/10 text-cinnabar rounded-full text-xs font-bold">Above Market</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-4 font-semibold text-steel">Item</th>
                  <th className="px-4 py-4 font-semibold text-steel">Ours</th>
                  <th className="px-4 py-4 font-semibold text-steel">Market</th>
                  <th className="px-4 py-4 font-semibold text-steel">Gap</th>
                  <th className="px-4 py-4 font-semibold text-steel">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/10">
                {overpriced.map((pos: any) => (
                  <tr key={pos.id} className="hover:bg-porcelain/30 transition-colors group">
                    <td className="px-4 py-4 font-medium text-deep-ink max-w-[120px] truncate" title={pos.metric}>{pos.metric}</td>
                    <td className="px-4 py-4 text-deep-ink">{pos.ours}</td>
                    <td className="px-4 py-4 text-steel">{pos.market}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-cinnabar/10 text-cinnabar">
                        {pos.gap}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {role === 'owner' ? (
                        <button 
                          onClick={() => openActionModal(pos, pos.marketPriceRaw)}
                          className="text-xs font-bold bg-steel/10 text-steel px-3 py-1.5 rounded-lg hover:bg-deep-ink-light hover:text-porcelain transition-all whitespace-nowrap"
                        >
                          Match Market
                        </button>
                      ) : (
                        <button 
                          disabled
                          title="Contact owner to perform this action"
                          className="text-xs font-bold bg-steel/5 text-steel/40 px-3 py-1.5 rounded-lg cursor-not-allowed whitespace-nowrap"
                        >
                          Contact Owner
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {overpriced.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-steel">No overpriced items.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Below Market (Underpriced / Opportunities) */}
        <div className="bg-white rounded-2xl shadow-sm border border-steel/10 overflow-hidden">
          <div className="p-6 border-b border-steel/10 bg-porcelain/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-deep-ink">Underpriced Items</h2>
            <span className="px-3 py-1 bg-jade/10 text-jade rounded-full text-xs font-bold">Margin Opportunities</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-4 font-semibold text-steel">Item</th>
                  <th className="px-4 py-4 font-semibold text-steel">Ours</th>
                  <th className="px-4 py-4 font-semibold text-steel">Market</th>
                  <th className="px-4 py-4 font-semibold text-steel">Gap</th>
                  <th className="px-4 py-4 font-semibold text-steel">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/10">
                {underpriced.map((pos: any) => (
                  <tr key={pos.id} className="hover:bg-porcelain/30 transition-colors group">
                    <td className="px-4 py-4 font-medium text-deep-ink max-w-[120px] truncate" title={pos.metric}>{pos.metric}</td>
                    <td className="px-4 py-4 text-deep-ink">{pos.ours}</td>
                    <td className="px-4 py-4 text-steel">{pos.market}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-jade/10 text-jade">
                        {pos.gap}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {role === 'owner' ? (
                        <button 
                          onClick={() => openActionModal(pos, pos.marketPriceRaw)}
                          className="text-xs font-bold bg-steel/10 text-steel px-3 py-1.5 rounded-lg hover:bg-deep-ink-light hover:text-porcelain transition-all whitespace-nowrap"
                        >
                          Raise Price
                        </button>
                      ) : (
                        <button 
                          disabled
                          title="Contact owner to perform this action"
                          className="text-xs font-bold bg-steel/5 text-steel/40 px-3 py-1.5 rounded-lg cursor-not-allowed whitespace-nowrap"
                        >
                          Contact Owner
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {underpriced.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-steel">No underpriced items.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- Modals --- */}
      {actionModal && actionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-deep-ink/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-deep-ink mb-2">Confirm Price Action</h3>
            <p className="text-steel text-sm mb-6">
              You are modifying the selling price of <span className="font-bold text-deep-ink">{actionModal.item.metric}</span>.
              <br />
              <span className="text-xs text-steel/70 mt-1 block">Current Price: <span className="font-bold text-cinnabar">PKR {formatNumber(actionModal.item.ourPriceRaw)}</span> | Market Price: <span className="font-bold text-jade">PKR {formatNumber(actionModal.item.marketPriceRaw)}</span></span>
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-deep-ink mb-2">Set New Price (PKR)</label>
              <input 
                type="number" 
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={actionModal.item.marketPriceRaw.toString()}
                className="w-full bg-porcelain border border-steel/30 rounded-lg px-4 py-2.5 text-deep-ink font-medium focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade transition-all"
              />
              <p className="text-xs font-medium text-steel mt-2">
                {actionModal.item.ourPriceRaw > actionModal.item.marketPriceRaw 
                  ? `Allowed range: ${formatNumber(actionModal.item.marketPriceRaw)} to ${formatNumber(actionModal.item.ourPriceRaw)} PKR` 
                  : `Allowed range: ${formatNumber(actionModal.item.ourPriceRaw)} to ${formatNumber(actionModal.item.marketPriceRaw)} PKR`}
              </p>
            </div>
            {errorMsg && (
              <div className="mb-4 p-3 bg-cinnabar/10 text-cinnabar text-sm rounded-lg border border-cinnabar/20">
                {errorMsg}
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-8">
              <button onClick={() => {setActionModal(null); setErrorMsg('');}} className="px-4 py-2 text-sm font-bold text-steel hover:text-deep-ink transition-colors">Cancel</button>
              <button 
                onClick={handlePriceAction} 
                disabled={actionLoading}
                className="px-6 py-2 bg-jade text-deep-ink text-sm font-bold rounded-xl hover:shadow-[var(--drop-shadow-glow-jade)] transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
