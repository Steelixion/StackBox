import React from 'react';

export default function Loading() {
  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col animate-pulse">
      <div className="mb-8 shrink-0">
        <div className="h-9 w-64 bg-steel/20 rounded-lg mb-2" />
        <div className="h-5 w-96 bg-steel/10 rounded-md" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-steel/10 overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b border-steel/10 flex gap-4">
          <div className="h-10 flex-1 bg-porcelain rounded-lg" />
          <div className="h-10 w-48 bg-porcelain rounded-lg" />
        </div>
        
        <div className="p-6 space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg bg-porcelain" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-porcelain rounded" />
                  <div className="h-3 w-20 bg-porcelain rounded" />
                </div>
              </div>
              <div className="h-4 w-32 bg-porcelain rounded" />
              <div className="h-6 w-20 bg-porcelain rounded-full" />
              <div className="h-4 w-16 bg-porcelain rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
