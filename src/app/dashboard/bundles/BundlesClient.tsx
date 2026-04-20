'use client';

import React, { useOptimistic, useTransition, useState } from 'react';
import type { BundlingStrategy } from '@/lib/db';
import { toggleManualBundle, deleteManualBundle, createManualBundle } from '@/actions/inventory';

type OptimisticAction =
  | { type: 'TOGGLE'; payload: number }
  | { type: 'DELETE'; payload: number }
  | { type: 'ADD'; payload: BundlingStrategy };

export default function BundlesClient({
  initialBundles,
  availableProducts
}: {
  initialBundles: BundlingStrategy[],
  availableProducts: string[]
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [margin, setMargin] = useState('+15%');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Optimistic Hook Setup
  const [optimisticBundles, dispatchOptimistic] = useOptimistic<BundlingStrategy[], OptimisticAction>(
    initialBundles,
    (state, action) => {
      switch (action.type) {
        case 'TOGGLE':
          return state.map(b => b.id === action.payload ? { ...b, applied: !b.applied } : b);
        case 'DELETE':
          return state.filter(b => b.id !== action.payload);
        case 'ADD':
          return [action.payload, ...state];
        default:
          return state;
      }
    }
  );

  const handleToggle = (id: number) => {
    // Prevent toggling optimistic items (they don't exist on server yet)
    if (Math.floor(id) !== id) return;

    startTransition(async () => {
      dispatchOptimistic({ type: 'TOGGLE', payload: id });
      const res = await toggleManualBundle(id, 'Admin_MGR_01');
      if (!res?.success) {
        setErrorMsg('Failed to sync toggle state with mainframe.');
      }
    });
  };

  const handleDelete = (id: number) => {
    if (Math.floor(id) !== id) return;

    startTransition(async () => {
      dispatchOptimistic({ type: 'DELETE', payload: id });
      await deleteManualBundle(id, 'Admin_MGR_01');
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComponents.length === 0) {
      setErrorMsg('Select at least one component');
      return;
    }
    setErrorMsg('');

    startTransition(async () => {
      // 1. Optimistic UI update instantly renders card locally
      const mockBundle: BundlingStrategy = {
        id: Math.random(), // Temp ID
        name,
        projectedMargin: margin,
        components: selectedComponents,
        applied: false,
      };
      dispatchOptimistic({ type: 'ADD', payload: mockBundle });

      // 2. Server Action (which includes Zod Parsing internally)
      const res = await createManualBundle({ name, projectedMargin: margin, components: selectedComponents }, 'Admin_MGR_01');
      if (!res.success) {
        setErrorMsg(res.error || 'Syntax constraint failed. Check inputs.');
      } else {
        setName('');
        setMargin('+15%');
        setSelectedComponents([]);
      }
    });
  };

  const filteredProducts = availableProducts.filter(p =>
    p.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedComponents.includes(p)
  );

  const addComponent = (product: string) => {
    setSelectedComponents(prev => [...prev, product]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removeComponent = (product: string) => {
    setSelectedComponents(prev => prev.filter(p => p !== product));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Creation Tooling */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
          <h2 className="text-lg font-bold text-deep-ink mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Construct Bundle
          </h2>
          {errorMsg && (
            <div className="mb-4 bg-cinnabar/10 text-cinnabar text-xs font-bold px-3 py-2 rounded-lg border border-cinnabar/20 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-steel tracking-widest uppercase mb-1">Strategy Name</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. EV Battery Base"
                className="w-full bg-porcelain border border-steel/10 rounded-lg px-3 py-2 text-sm text-deep-ink focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-steel tracking-widest uppercase mb-2">Target Margin Extrapolation</label>
              <input
                value={margin} onChange={e => setMargin(e.target.value)}
                placeholder="e.g. +20%"
                className="w-full bg-porcelain border border-steel/10 rounded-lg px-3 py-2.5 text-sm font-mono text-deep-ink focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade transition-all"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold text-steel tracking-widest uppercase mb-2">Add Components</label>
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search inventory..."
                  className="w-full bg-porcelain border border-steel/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-deep-ink focus:outline-none focus:border-jade focus:ring-1 focus:ring-jade transition-all"
                />
                <svg className="w-4 h-4 absolute left-3 top-3 text-steel/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              {showDropdown && searchTerm && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-steel/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-3xl">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => addComponent(p)}
                        className="w-full text-left px-4 py-3 text-sm text-deep-ink hover:bg-jade hover:text-white transition-colors flex items-center justify-between group"
                      >
                        {p}
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-steel">No matching products found</div>
                  )}
                </div>
              )}
            </div>

            {/* Fashionable List Box */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-steel tracking-widest uppercase mt-4 mb-2 flex justify-between items-center">
                Selected Matrix Items
                <span className="bg-porcelain px-2 py-0.5 rounded text-deep-ink">{selectedComponents.length} items</span>
              </label>
              <div className="bg-porcelain/50 border border-steel/5 rounded-xl p-2 min-h-[160px] max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-steel/10">
                {selectedComponents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-[10px] text-steel font-bold uppercase tracking-wider">Engine Idle</p>
                    <p className="text-[10px] text-steel/60 mt-1">Add components to begin build</p>
                  </div>
                ) : (
                  selectedComponents.map((comp) => (
                    <div
                      key={comp}
                      className="group flex items-center justify-between p-3 bg-white/60 backdrop-blur-md rounded-lg shadow-sm border border-white hover:border-jade/30 transition-all animate-in slide-in-from-left duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-jade/40" />
                        <span className="text-sm font-medium text-deep-ink">{comp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeComponent(comp)}
                        className="text-steel/40 hover:text-cinnabar transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || selectedComponents.length === 0}
              className="w-full bg-deep-ink text-white font-bold text-xs py-4 rounded-xl hover:bg-jade hover:text-deep-ink hover:shadow-[var(--drop-shadow-glow-jade)] transition-all disabled:opacity-50 mt-4 active:scale-[0.98] transform"
            >
              {isPending ? 'SYNCING MATRIX...' : 'COMMIT BUNDLE STRATEGY'}
            </button>
          </form>
        </div>
      </div>

      {/* Analytics Matrix Grid */}
      <div className="lg:col-span-2 space-y-4">
        {optimisticBundles.map((bundle) => (
          <div key={bundle.id} className={`p-6 rounded-2xl border transition-all ${bundle.applied ? 'bg-jade/5 border-jade/30 shadow-[0_0_20px_rgba(45,212,191,0.05)]' : 'bg-white border-steel/10 shadow-sm hover:border-steel/30'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`text-lg font-bold ${bundle.applied ? 'text-deep-ink' : 'text-deep-ink'}`}>{bundle.name}</h3>
                <p className="text-xs text-steel mt-1 font-mono">
                  ID: #{bundle.id} <span className="mx-2">|</span>
                  Updated By: {bundle.updatedBy || bundle.createdBy || 'SYSTEM'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${bundle.applied ? 'bg-jade/10 text-jade border-jade/20' : 'bg-porcelain text-steel border-steel/20'}`}>
                  {bundle.projectedMargin} MARGIN
                </span>

                {/* Deletion / Revoke Action */}
                <button
                  onClick={() => handleDelete(bundle.id)}
                  disabled={isPending || Math.floor(bundle.id) !== bundle.id}
                  className="w-8 h-8 rounded bg-porcelain text-steel flex items-center justify-center hover:bg-cinnabar hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {bundle.components.map((c, i) => (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded font-medium border ${bundle.applied ? 'bg-white text-jade border-jade/20' : 'bg-porcelain text-steel border-steel/10'}`}>
                    {c}
                  </span>
                ))}
              </div>

              {/* Central Toggle Matrix Logic */}
              <button
                onClick={() => handleToggle(bundle.id)}
                disabled={isPending || Math.floor(bundle.id) !== bundle.id}
                className={`ml-4 px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all pointer-events-auto shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${bundle.applied ? 'bg-jade text-deep-ink border-jade shadow-[var(--drop-shadow-glow-jade)] hover:bg-jade/80' : 'bg-porcelain text-steel border-steel/10 hover:bg-deep-ink hover:text-white'}`}
              >
                {bundle.applied ? 'ACTIVE MATRIX' : 'ENABLE'}
              </button>
            </div>
          </div>
        ))}

        {optimisticBundles.length === 0 && (
          <div className="bg-porcelain/50 rounded-2xl h-64 flex flex-col items-center justify-center border border-steel/10 border-dashed">
            <svg className="w-12 h-12 text-steel/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-steel font-bold">No Active Bundles</p>
            <p className="text-xs text-steel/70 mt-1">Use the matrix builder to instantiate a strategy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
