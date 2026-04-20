'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client Hub Failure:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 bg-cinnabar/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-cinnabar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-deep-ink mb-4">Pipeline Synchronisation Error</h2>
      <p className="text-steel max-w-md mb-8">
        The enterprise matrix failed to retrieve client data. This may be due to a malformed data schema or an unstable connection to the trader ledger.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={reset}
          className="px-8 py-3 bg-deep-ink text-white rounded-xl font-bold text-sm hover:bg-jade hover:text-deep-ink transition-all shadow-lg hover:shadow-[var(--drop-shadow-glow-jade)]"
        >
          Retry Matrix Sync
        </button>
      </div>
    </div>
  );
}
