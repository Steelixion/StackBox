'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import FloatingAgent from '../../components/FloatingAgent';
import type { NotificationItem } from '@/lib/notifications-db';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── Load session user ────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => null);
  }, []);

  // ── Load live notifications ───────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications.filter((n: NotificationItem) => !n.read));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Re-poll every 60 s for fresh alerts
    const timer = setInterval(loadNotifications, 60_000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Dismiss a notification ────────────────────────────────────────────────
  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDismissingId(null);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const unread = notifications.length;
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const alertDotColor = (level: NotificationItem['level']) => {
    if (level === 'info') return 'bg-jade';
    if (level === 'critical') return 'bg-cinnabar';
    return 'bg-steel';
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Inventory Trading', href: '/dashboard/inventory-trading', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { name: 'Shipments', href: '/dashboard/shipments', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { name: 'Invoices (OCR)', href: '/dashboard/invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Bundles Engine', href: '/dashboard/bundles', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Alerts Hub', href: '/dashboard/alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  ];

  return (
    <div className="flex h-screen bg-deep-ink-light overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-deep-ink/80 lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-deep-ink/90 backdrop-blur-3xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center space-x-2 group/logo relative">
            <div className="w-8 h-8 rounded bg-jade shadow-[var(--drop-shadow-glow-jade)] flex items-center justify-center group-hover/logo:scale-105 transition-transform duration-300">
              <svg className="w-5 h-5 text-deep-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-porcelain tracking-tight flex items-center">
              StackBox
              {/* EASTER EGG: Wuxing Logo Cycle */}
              <span className="ml-1 text-jade group-hover/logo:animate-[wuxing-cycle_4s_infinite_alternate]" style={{ animationDelay: '2s' }}>AI</span>
            </span>
          </Link>
          <button className="lg:hidden text-steel hover:text-porcelain" onClick={() => setSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${isActive ? 'bg-jade/10 text-jade font-medium' : 'text-steel hover:bg-white/5 hover:text-porcelain'}`}
              >
                <svg className={`w-5 h-5 mr-3 ${isActive ? 'text-jade' : 'text-steel group-hover:text-porcelain'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* EASTER EGG: Ghost in the Machine */}
        <div className="absolute bottom-0 w-full p-6 border-t border-white/10 group/terminal bg-deep-ink/40 backdrop-blur-sm z-40">
          <div className="text-xs text-steel/60 font-mono cursor-crosshair hover:text-porcelain/70 transition-colors inline-block">v1.0.0</div>
          <div className="h-0 opacity-0 overflow-hidden transition-all duration-500 ease-in-out group-hover/terminal:h-40 group-hover/terminal:opacity-100 group-hover/terminal:mt-3">
            <div className="bg-deep-ink border border-jade/30 rounded-lg p-3 text-[10px] font-mono text-jade h-full overflow-hidden relative shadow-[var(--drop-shadow-glow-jade)]">
              <div className="animate-[scrollUp_8s_linear_infinite] flex flex-col space-y-2 absolute left-3 right-3 pt-[120%]">
                <span className="whitespace-nowrap">&gt; Initializing OCR engine... [OK]</span>
                <span className="whitespace-nowrap">&gt; Connecting Supabase RLS... [OK]</span>
                <span className="whitespace-nowrap">&gt; Loading Wuxing patterns... [OK]</span>
                <span className="whitespace-nowrap text-cinnabar">&gt; Bypassing security... [FAILED]</span>
                <span className="whitespace-nowrap text-jade">&gt; Retrying handshake... [OK]</span>
                <span className="whitespace-nowrap font-bold">&gt; Ghost protocol active.</span>
                <span className="whitespace-nowrap animate-pulse">&gt; Scanning inventory...<span className="text-transparent">_</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-porcelain">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex-shrink-0 relative h-16 bg-white border-b border-steel/20 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20">
          <div className="flex items-center">
            <button className="lg:hidden text-steel hover:text-deep-ink focus:outline-none" onClick={() => setSidebarOpen(true)}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">

            {/* ── Notification Bell ──────────────────────────────────────── */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
                className="relative p-2 text-steel hover:text-deep-ink transition-colors rounded-lg hover:bg-porcelain"
                aria-label="Notifications"
              >
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cinnabar rounded-full border-2 border-white shadow-[var(--drop-shadow-glow-cinnabar)] animate-pulse" />
                )}
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-steel/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Dropdown Header */}
                  <div className="px-5 py-4 border-b border-steel/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-deep-ink">Notifications</h3>
                      <p className="text-xs text-steel mt-0.5">{unread > 0 ? `${unread} unread alert${unread > 1 ? 's' : ''}` : 'All caught up'}</p>
                    </div>
                    {unread > 0 && (
                      <button
                        onClick={async () => {
                          // Dismiss all at once
                          for (const n of notifications) {
                            await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) });
                          }
                          setNotifications([]);
                        }}
                        className="text-xs font-bold text-jade hover:text-jade/80 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-steel/5">
                    {notifications.length === 0 ? (
                      <div className="py-12 flex flex-col items-center text-steel/50">
                        <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">No active alerts</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`px-5 py-4 group hover:bg-porcelain/40 transition-colors flex items-start space-x-3 ${n.level === 'critical' ? 'bg-cinnabar/5' : ''}`}>
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${alertDotColor(n.level)}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${n.level === 'critical' ? 'text-cinnabar-dark' : 'text-deep-ink'}`}>{n.title}</p>
                            <p className="text-xs text-steel mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-steel/60 mt-1.5 font-mono">{n.timestamp}</p>
                          </div>
                          <button
                            onClick={() => handleDismiss(n.id)}
                            disabled={dismissingId === n.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-steel/40 hover:text-cinnabar ml-2 mt-0.5 flex-shrink-0 disabled:opacity-30"
                            title="Dismiss"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-steel/10 bg-porcelain/30">
                    <Link
                      href="/dashboard/alerts"
                      className="text-xs font-medium text-jade hover:text-jade/80 transition-colors"
                      onClick={() => setNotifOpen(false)}
                    >
                      View all in Dashboard Hub →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── User Profile ───────────────────────────────────────────── */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                className="flex items-center space-x-3 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-porcelain transition-colors"
              >
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-deep-ink flex items-center justify-center text-porcelain text-sm font-bold shadow-sm">
                    {initials}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-deep-ink leading-tight">{user?.name ?? 'Loading...'}</p>
                  <p className="text-xs text-steel leading-tight">{user?.email ?? ''}</p>
                </div>
                <svg className="w-4 h-4 text-steel hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-steel/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-steel/10">
                    <p className="text-sm font-semibold text-deep-ink truncate">{user?.name}</p>
                    <p className="text-xs text-steel truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-cinnabar hover:bg-cinnabar/5 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none" tabIndex={0}>
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      <FloatingAgent />
    </div>
  );
}
