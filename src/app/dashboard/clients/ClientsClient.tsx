'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { type Trader } from '@/lib/schemas';
import TradersTable from './components/TradersTable';
import TraderDetailDrawer from './components/TraderDetailDrawer';

interface ClientsClientProps {
  initialData: Trader[];
  total: number;
  initialPage: number;
  initialSearch: string;
  initialStatus: string;
}

export default function ClientsClient({
  initialData,
  total,
  initialPage,
  initialSearch,
  initialStatus,
}: ClientsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Selected Trader for Detail View
  const [selectedTraderId, setSelectedTraderId] = useState<string | null>(null);
  const selectedTrader = initialData.find((t) => t.id === selectedTraderId) || null;

  // Local state for immediate UI feedback before URL sync
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Sync Search Term to URL
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== initialSearch) {
        updateUrl({ search: searchTerm, page: '1' });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Sync Status to URL
  useEffect(() => {
    if (statusFilter !== initialStatus) {
      updateUrl({ status: statusFilter, page: '1' });
    }
  }, [statusFilter]);

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach((( [key, value] ) => {
      if (value) params.set(key, value);
      else params.delete(key);
    }));

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage.toString() });
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Table Section */}
      <div className={`flex-1 min-h-0 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <TradersTable 
          traders={initialData} 
          onSelect={setSelectedTraderId}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      {/* Pagination Controls */}
      <div className="shrink-0 py-6 flex items-center justify-between">
        <div className="text-xs text-steel font-medium">
          Showing <span className="text-deep-ink font-bold">{(initialPage - 1) * 10 + 1}</span> to{' '}
          <span className="text-deep-ink font-bold">{Math.min(initialPage * 10, total)}</span> of{' '}
          <span className="text-deep-ink font-bold">{total}</span> pipeline nodes
        </div>

        {totalPages > 1 && (
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(initialPage - 1)}
              disabled={initialPage <= 1 || isPending}
              className="p-2 bg-white border border-steel/20 rounded-lg text-steel hover:text-jade disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center px-4 bg-white border border-steel/20 rounded-lg text-xs font-bold text-deep-ink">
              PAGE {initialPage} / {totalPages}
            </div>

            <button
              onClick={() => handlePageChange(initialPage + 1)}
              disabled={initialPage >= totalPages || isPending}
              className="p-2 bg-white border border-steel/20 rounded-lg text-steel hover:text-jade disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Detail Drawer Overlay */}
      <TraderDetailDrawer 
        isOpen={!!selectedTraderId}
        onClose={() => setSelectedTraderId(null)}
        trader={selectedTrader}
      />
    </div>
  );
}
