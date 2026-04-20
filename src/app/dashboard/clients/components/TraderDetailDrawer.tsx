import React from 'react';
import { type Trader } from '@/lib/schemas';

interface TraderDetailDrawerProps {
  trader: Trader | null;
  onClose: () => void;
  isOpen: boolean;
}

export default function TraderDetailDrawer({
  trader,
  onClose,
  isOpen,
}: TraderDetailDrawerProps) {
  if (!trader) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-deep-ink/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-500 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 bg-deep-ink text-white">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-jade/20 flex items-center justify-center text-xl font-bold text-jade border border-jade/30">
                {trader.companyName.substring(0, 1)}
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="text-2xl font-bold">{trader.companyName}</h2>
            <div className="flex items-center space-x-2 mt-1 text-steel">
              <span className="text-xs font-mono">{trader.id}</span>
              <span>•</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                trader.status === 'Active' 
                  ? 'border-jade/50 text-jade' 
                  : 'border-cinnabar/50 text-cinnabar'
              }`}>
                {trader.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
            {/* Contact Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-porcelain rounded-xl border border-steel/10">
                <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Email Terminal</label>
                <div className="text-sm font-medium text-deep-ink break-words">{trader.email}</div>
              </div>
              <div className="p-4 bg-porcelain rounded-xl border border-steel/10">
                <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Mobile Uplink</label>
                <div className="text-sm font-medium text-deep-ink">{trader.phone}</div>
              </div>
              <div className="col-span-2 p-4 bg-porcelain rounded-xl border border-steel/10">
                <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Registered Address</label>
                <div className="text-sm font-medium text-deep-ink">{trader.address || 'Unknown Region'}</div>
              </div>
            </div>

            {/* Supply Ledger */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-deep-ink uppercase tracking-wider">Supply Matrix Ledger</h3>
                <span className="px-2 py-1 bg-deep-ink text-white text-[10px] font-bold rounded">
                  {trader.supplies.length} PRODUCT LINES
                </span>
              </div>
              <div className="space-y-3">
                {trader.supplies.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border border-steel/10 rounded-xl hover:border-jade/50 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-porcelain flex items-center justify-center text-jade font-bold border border-steel/5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-deep-ink group-hover:text-jade-dark transition-colors">{item.product}</div>
                        <div className="text-xs text-steel">Standard Supply Frequency</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-deep-ink">{item.qty.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-steel uppercase tracking-tighter">{item.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Audit */}
            <div className="pt-4 border-t border-steel/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-steel font-medium italic">Last Logistics Audit Conducted:</span>
                <span className="text-deep-ink font-bold font-mono">{trader.lastAuditDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-steel/10 bg-porcelain/30 flex gap-3">
            <button className="flex-1 px-4 py-3 bg-deep-ink text-white text-xs font-bold rounded-xl hover:bg-jade hover:text-deep-ink transition-all uppercase tracking-wider">
              Request Supply Update
            </button>
            <button className="px-4 py-3 bg-white border border-steel/20 text-steel hover:text-cinnabar hover:border-cinnabar transition-all rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
