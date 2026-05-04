'use client';
import React, { useEffect, useState } from 'react';
import {
  fetchTradingAlerts, fetchRestockSuggestions,
  fetchDemandForecastData, fetchValuationMetrics
} from '@/actions/inventory';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function InventoryTradingPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [restockItems, setRestockItems] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);

  // Load everything in parallel without blocking the whole UI
  useEffect(() => {
    fetchTradingAlerts().then(setAlerts);
    fetchRestockSuggestions().then(setRestockItems);
    fetchDemandForecastData().then(setForecastData);
    fetchValuationMetrics().then(setValuation);
  }, []);

  return (
    <div className="space-y-6 pb-12 p-6 bg-porcelain/20 min-h-screen">
      <header>
        <h1 className="text-2xl font-bold text-deep-ink">Inventory Trading Hub</h1>
        <p className="text-steel text-sm">Live Valuation & Arbitrage Analysis</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valuation Widget - Shows Skeleton if loading */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-steel/10 min-h-[300px]">
          <h2 className="text-lg font-bold text-deep-ink mb-6">Stock vs. External Market</h2>
          {!valuation ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-porcelain rounded-xl"></div>
              <div className="h-12 bg-porcelain rounded-xl"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-5 bg-porcelain/50 rounded-2xl">
                  <p className="text-xs text-steel font-bold uppercase">Internal Cost</p>
                  <p className="text-2xl font-bold text-deep-ink mt-2">${(valuation.internal / 1000).toFixed(1)}k</p>
                </div>
                <div className="p-5 bg-jade/5 rounded-2xl border border-jade/10">
                  <p className="text-xs text-jade font-bold uppercase">Market Value</p>
                  <p className="text-2xl font-bold text-deep-ink mt-2">${(valuation.market / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-jade mt-2">+{valuation.arbitrage}% Potential</p>
                </div>
              </div>
              <div className="relative h-12 w-full bg-porcelain rounded-xl overflow-hidden flex border border-steel/10">
                <div className="h-full bg-deep-ink transition-all duration-700 flex items-center px-4" style={{ width: `${valuation.internalPct}%` }}>
                  <span className="text-[10px] font-bold text-white uppercase">Internal</span>
                </div>
                <div className="h-full bg-jade transition-all duration-700 flex items-center justify-end px-4" style={{ width: `${valuation.marketPct}%` }}>
                  <span className="text-[10px] font-bold text-deep-ink uppercase">Market</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Forecast Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-steel/10 min-h-[300px]">
          <h2 className="text-lg font-bold text-deep-ink mb-4">Demand Forecasting</h2>
          <div className="h-48 w-full bg-deep-ink rounded-xl p-4">
            {forecastData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData}>
                  <XAxis dataKey="period" hide />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="units" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-steel/30 text-xs italic">Calculating Trends...</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-steel/10 h-[400px] overflow-y-auto">
          <h2 className="text-sm font-bold text-deep-ink mb-4 uppercase tracking-wider">AI Trading Alerts</h2>
          {alerts.length > 0 ? alerts.map((alert: any) => (
            <div key={alert.id} className="mb-3 p-4 bg-porcelain/30 rounded-xl border border-steel/5">
              <span className="text-xs font-bold text-deep-ink block">{alert.title}</span>
              <p className="text-xs text-steel mt-1">{alert.message}</p>
            </div>
          )) : <p className="text-xs text-steel/50 italic">No critical alerts...</p>}
        </div>

        {/* Restocking Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-steel/10">
          <h2 className="text-sm font-bold text-deep-ink mb-4 uppercase tracking-wider">Restock Pipeline</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-steel border-b border-steel/10">
                  <th className="pb-3">ITEM ID</th>
                  <th className="pb-3">SUGGESTED</th>
                  <th className="pb-3">REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel/5">
                {restockItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-4 font-bold">{item.item_id}</td>
                    <td className="py-4 text-jade font-bold">{item.suggested_quantity}</td>
                    <td className="py-4 text-steel">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}