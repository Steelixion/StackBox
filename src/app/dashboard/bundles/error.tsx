'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Bundling Engine Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-16 h-16 bg-cinnabar/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-cinnabar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-deep-ink mb-2">Matrix Synchronization Failed</h2>
      <p className="text-steel text-sm max-w-md text-center mb-8">
        An error occurred while running the manual bundling logic. Our validation engine has safely blocked any corrupted inputs.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-deep-ink text-white rounded-lg font-bold text-sm hover:bg-jade hover:text-deep-ink hover:shadow-[var(--drop-shadow-glow-jade)] transition-all"
        >
          Try Again
        </button>
        <Link href="/dashboard" className="px-6 py-2 bg-porcelain text-deep-ink rounded-lg font-bold text-sm hover:bg-steel/20 transition-all">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
