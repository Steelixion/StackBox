'use client';
import React, { useEffect, useState, useCallback } from 'react';
import type { NotificationItem } from '@/lib/notifications-db';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all alerts (we can show read and unread based on preference, here we'll show all)
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.notifications); // Showing all notifications for historical tracking
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const handleDismissAlert = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return; // Prevent dismissing already read alerts
    setDismissingId(id);
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
    setDismissingId(null);
  };

  const alertDotColor = (level: NotificationItem['level'], read: boolean) => {
    if (read) return 'bg-steel/50';
    if (level === 'info') return 'bg-jade shadow-[var(--drop-shadow-glow-jade)]';
    if (level === 'critical') return 'bg-cinnabar shadow-[var(--drop-shadow-glow-cinnabar)]';
    return 'bg-steel';
  };

  const alertItemBg = (level: NotificationItem['level'], read: boolean) => {
    if (read) return 'bg-white hover:bg-porcelain/30 opacity-70';
    if (level === 'critical') return 'bg-cinnabar/5 hover:bg-cinnabar/10';
    return 'bg-porcelain/30 hover:bg-porcelain/50';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-deep-ink">Global Alerts Log</h1>
        <p className="text-steel text-sm mt-1">Complete diagnostic and notification history across all systems.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-0 overflow-hidden">
        <div className="p-8 flex justify-between items-center border-b border-steel/10">
          <h2 className="text-lg font-bold text-deep-ink">All Network Notifications</h2>
          {!isLoading && alerts.filter(a => !a.read).length > 0 && (
            <span className="px-3 py-1 rounded-full bg-cinnabar/10 text-cinnabar text-xs font-bold shadow-sm">
              {alerts.filter(a => !a.read).length} Unread Actions Required
            </span>
          )}
        </div>

        <div className="p-4 sm:p-8 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-5 rounded-xl bg-porcelain/30 animate-pulse h-20 border border-transparent" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-steel/50">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-base font-medium">No alerts registered in the network.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`p-5 rounded-xl transition-colors group border border-steel/5 ${alertItemBg(alert.level, alert.read)}`}>
                <div className="flex items-start sm:items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${alertDotColor(alert.level, alert.read)}`}></div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="uppercase tracking-widest text-[10px] font-bold text-steel bg-porcelain/50 px-2 py-0.5 rounded border border-steel/10">{alert.category}</span>
                        <p className={`text-base font-semibold truncate ${alert.level === 'critical' && !alert.read ? 'text-cinnabar-dark' : 'text-deep-ink'}`}>{alert.title}</p>
                      </div>
                      <p className="text-sm text-steel mt-1 leading-relaxed max-w-3xl">{alert.message}</p>
                    </div>
                    <div className="flex items-center space-x-6 mt-3 sm:mt-0">
                      <p className="text-xs text-steel/70 font-mono tracking-wide">{alert.timestamp}</p>
                      <button
                        onClick={() => handleDismissAlert(alert.id, alert.read)}
                        disabled={alert.read || dismissingId === alert.id}
                        className={`text-xs font-bold transition-colors w-24 text-right ${
                          alert.read 
                            ? 'text-jade tracking-wide' 
                            : 'text-cinnabar hover:text-cinnabar-dark opacity-80 hover:opacity-100 disabled:opacity-30'
                        }`}
                      >
                        {alert.read ? '✓ CLEARED' : dismissingId === alert.id ? 'PROCESSING...' : 'DISMISS'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
