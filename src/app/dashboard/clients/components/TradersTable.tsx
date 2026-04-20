import React from 'react';
import { type Trader } from '@/lib/schemas';

interface TradersTableProps {
  traders: Trader[];
  onSelect: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
}

export default function TradersTable({
  traders,
  onSelect,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
}: TradersTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-steel/10 overflow-hidden flex flex-col h-full">
      {/* Controls Bar */}
      <div className="p-4 border-b border-steel/10 bg-porcelain/30 backdrop-blur-md flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search company or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-steel/20 rounded-lg pl-10 pr-4 py-2 text-sm text-deep-ink focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade transition-all"
          />
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-steel uppercase tracking-widest">Pipeline Status:</span>
          <div className="flex bg-white border border-steel/20 rounded-lg p-1">
            {['All', 'Active', 'Idle'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                  statusFilter === s ? 'bg-deep-ink text-white shadow-sm' : 'text-steel hover:bg-porcelain'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto flex-1 h-full scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(148,163,184,0.1)]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-steel uppercase tracking-widest">Company Baseline</th>
              <th className="px-6 py-4 text-[10px] font-bold text-steel uppercase tracking-widest">Contact Node</th>
              <th className="px-6 py-4 text-[10px] font-bold text-steel uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-steel uppercase tracking-widest text-right">Supply Value</th>
              <th className="px-6 py-4 text-[10px] font-bold text-steel uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel/5">
            {traders.map((trader) => (
              <tr 
                key={trader.id} 
                onClick={() => onSelect(trader.id)}
                className="hover:bg-porcelain/50 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-deep-ink flex items-center justify-center text-xs font-bold text-jade">
                      {trader.companyName.substring(0, 1)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-deep-ink">{trader.companyName}</div>
                      <div className="text-[10px] text-steel font-mono">{trader.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm text-deep-ink">{trader.email}</div>
                  <div className="text-xs text-steel">{trader.phone}</div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    trader.status === 'Active' 
                      ? 'bg-jade/10 text-jade-dark border-jade/20' 
                      : 'bg-cinnabar/10 text-cinnabar border-cinnabar/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${trader.status === 'Active' ? 'bg-jade animate-pulse' : 'bg-cinnabar'}`} />
                    {trader.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-5 text-right font-mono text-sm font-bold text-deep-ink">
                  {trader.totalValue}
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-steel hover:text-jade transition-colors">
                    <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {traders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-t border-steel/5">
            <svg className="w-12 h-12 text-steel/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-steel text-sm font-bold">No Traders Found</p>
            <p className="text-xs text-steel/60">Try adjusting your matrix filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
