'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/actions/auth';
import ChatPanel from '@/components/ChatPanel';
import type { NotificationItem } from '@/lib/notifications-db';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchUserSession = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (!profile) {
        router.push('/login');
        return;
      }
      //@ts-ignore
      setUser(profile);
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserSession();
  }, [fetchUserSession]);

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
    const timer = setInterval(loadNotifications, 60_000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Predictive Intel', href: '/dashboard/predictions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Employee Boxes', href: '/dashboard/employee-boxes', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ['Manager', 'Owner'] },
    { name: 'Shipments', href: '/dashboard/shipments', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { name: 'Invoices', href: '/dashboard/invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Bundles Engine', href: '/dashboard/bundles', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Client Trade Hub', href: '/dashboard/clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Alerts Hub', href: '/dashboard/alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Employees', href: '/dashboard/employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', roles: ['Manager', 'Owner'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    //@ts-ignore
    return item.roles.includes(user?.role || '');
  });

  return (
    <div className="flex h-screen bg-deep-ink-light overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-deep-ink/80 lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Sidebar (Nav) */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-deep-ink/90 backdrop-blur-3xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center space-x-2 group/logo relative">
            <div className="w-8 h-8 rounded bg-jade flex items-center justify-center">
              <svg className="w-5 h-5 text-deep-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-porcelain tracking-tight">StackBox <span className="text-jade">AI</span></span>
          </Link>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {filteredNavItems.map((item) => (
            <Link key={item.name} href={item.href} className={`flex items-center px-4 py-3 rounded-lg transition-colors ${pathname === item.href ? 'bg-jade/10 text-jade' : 'text-steel hover:bg-white/5 hover:text-porcelain'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-porcelain relative transition-all duration-300">
        <header className="flex-shrink-0 h-16 bg-white border-b border-steel/20 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-steel" onClick={() => setSidebarOpen(true)}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <h2 className="hidden md:block font-bold text-deep-ink capitalize tracking-tight">
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded-full transition-all border shadow-sm ${isChatOpen ? 'bg-white border-steel/10 text-steel hover:text-cinnabar hover:border-cinnabar/20' : 'bg-jade border-jade/50 text-deep-ink hover:scale-110 shadow-lg shadow-jade/20'}`}
              title={isChatOpen ? "Close Assistant" : "Open Assistant"}
            >
              {isChatOpen ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>

            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center space-x-3 p-1 hover:bg-porcelain rounded-xl transition-colors">
                {user?.picture ? (
                  <img src={user.picture} className="w-8 h-8 rounded-full shadow-sm" alt="" />
                ) : (
                  <div className={`w-8 h-8 ${loading ? 'bg-steel/10 animate-pulse' : 'bg-deep-ink text-white'} rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white`}>
                    {loading ? null : initials}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  {loading ? (
                    <div className="space-y-1.5 flex flex-col">
                      <div className="h-3 w-20 bg-steel/10 rounded animate-pulse" />
                      <div className="h-2 w-12 bg-steel/5 rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-deep-ink leading-none">{user?.name}</p>
                      <p className="text-[10px] text-steel font-bold uppercase mt-1 tracking-wider opacity-60">{user?.role}</p>
                    </>
                  )}
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-steel/10 rounded-xl shadow-xl z-50 p-1 animate-in slide-in-from-top-2">
                  <button onClick={handleLogout} className="w-full text-left p-3 text-sm text-cinnabar hover:bg-cinnabar/5 rounded-lg font-bold flex items-center">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Right Sidebar (Chatbot) */}
      {isChatOpen && (
        <aside className="hidden xl:block h-full shrink-0 border-l border-steel/10 animate-in slide-in-from-right duration-500 ease-out">
          <ChatPanel />
        </aside>
      )}
    </div>
  );
}