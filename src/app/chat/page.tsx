'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
}

const SUGGESTION_CARDS = [
  {
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
    label: 'Analyze Market Trends',
    prompt: 'Analyze the latest regional market trends and identify top opportunities.',
  },
  {
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    label: 'Check Low Stock',
    prompt: 'Identify critically low stock across all facilities and recommend restock priorities.',
  },
  {
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    label: 'Review Pending Invoices',
    prompt: 'Review OCR accuracy and summarize all pending invoices requiring manual review.',
  },
  {
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Optimize Fleet Routes',
    prompt: 'Optimize fleet routing for all active In-Transit shipments and flag any delays.',
  },
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [apiWarning, setApiWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // ── Load conversation list from JSON DB ───────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load a specific conversation's messages ───────────────────────────────
  const loadConversation = async (id: string) => {
    setIsLoading(true);
    setActiveConvId(id);
    setIsSidebarOpen(false);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.conversation?.messages ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Start a brand-new conversation ───────────────────────────────────────
  const startNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputMessage('');
    setApiWarning(false);
    setIsSidebarOpen(false);
    inputRef.current?.focus();
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? inputMessage).trim();
    if (!text || isThinking) return;

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsThinking(true);
    setApiWarning(false);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConvId, message: text }),
      });

      const data = await res.json();

      if (res.status === 503 && data.fallback) {
        // No API key — show warning, use a fallback response
        setApiWarning(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-fallback-${Date.now()}`,
            role: 'ai',
            text: '⚠️ AI model not connected. Add your `GEMINI_API_KEY` to `.env.local` and restart the dev server to enable real AI responses.',
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, role: 'ai', text: `Error: ${data.error ?? 'Something went wrong.'}`, timestamp: new Date().toISOString() },
        ]);
        return;
      }

      // Set conversation ID if brand new
      if (!activeConvId && data.conversationId) {
        setActiveConvId(data.conversationId);
        // Refresh sidebar conversation list
        await loadConversations();
      }

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: data.message.text,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'ai', text: 'Network error. Please check your connection.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // ── Delete conversation ────────────────────────────────────────────────────
  const handleDeleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/chat/send?conversationId=${id}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) startNewConversation();
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] overflow-hidden text-porcelain font-sans p-0 sm:p-4 lg:p-8 gap-0 sm:gap-4 lg:gap-6 relative">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#161C24] sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out
        lg:translate-x-0 lg:relative lg:flex lg:z-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded bg-jade shadow-[var(--drop-shadow-glow-jade)] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <svg className="w-5 h-5 text-deep-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-porcelain tracking-tight">StackBox <span className="text-teal-400">AI</span></span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-steel hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-5">
          <button
            onClick={startNewConversation}
            className="flex items-center space-x-3 w-full px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-colors font-medium text-sm text-porcelain shadow-sm hover:shadow-[0_0_15px_rgba(45,212,191,0.2)] focus:outline-none"
          >
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Command</span>
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 mt-2">Recent Logs</h3>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-600 px-4">No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm flex items-center group relative ${activeConvId === conv.id ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-porcelain hover:bg-white/[0.04]'}`}
              >
                <svg className="w-4 h-4 mr-3 flex-shrink-0 text-slate-500 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="truncate flex-1">{conv.title}</span>
                {/* Delete button */}
                <span
                  role="button"
                  onClick={(e) => handleDeleteConv(e, conv.id)}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0 cursor-pointer"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">

        <div className="flex-1 flex flex-col relative bg-[#161C24] sm:rounded-2xl lg:rounded-[2rem] shadow-2xl overflow-hidden min-w-0 border border-white/[0.02] mb-4 sm:mb-6 lg:mb-8">

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#161C24] shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-steel hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="font-bold text-porcelain tracking-tight text-lg">StackBox <span className="text-teal-400">AI</span></span>
            </div>
            <Link href="/dashboard" className="text-slate-400 hover:text-porcelain text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5">
              Hub
            </Link>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center space-y-3 text-slate-500">
                  <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Loading conversation...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              /* ── Empty State ── */
              <div className="min-h-full flex flex-col">
                <div className="m-auto flex flex-col items-center w-full max-w-3xl py-8 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.2)] flex items-center justify-center ring-1 ring-teal-500/20">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-teal-300 max-w-2xl leading-tight mb-2">
                    Hello, Manager.<br />What shall we optimize today?
                  </h1>

                  {apiWarning && (
                    <div className="w-full max-w-lg bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3 text-xs text-amber-400 text-center">
                      AI model not configured. Add <code className="font-mono bg-black/30 px-1 rounded">GEMINI_API_KEY</code> to <code className="font-mono bg-black/30 px-1 rounded">.env.local</code> and restart the server.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full">
                    {SUGGESTION_CARDS.map((card) => (
                      <button
                        key={card.label}
                        onClick={() => handleSend(card.prompt)}
                        disabled={isThinking}
                        className="flex text-left items-start p-6 rounded-3xl bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-teal-500/20 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(45,212,191,0.1)] transition-all duration-300 group cursor-pointer disabled:opacity-50"
                      >
                        <div className="bg-white/5 p-2 rounded-xl mr-4 group-hover:bg-teal-500/10 transition-colors">
                          <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                          </svg>
                        </div>
                        <span className="text-slate-200 text-sm font-medium leading-relaxed mt-1">{card.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Message Thread ── */
              <div className="w-full max-w-3xl mx-auto space-y-8 pb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    {msg.role === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.15)] flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-3xl px-6 py-4 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-slate-800 text-porcelain rounded-br-sm' : 'bg-transparent text-slate-200'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="bg-transparent px-6 py-4 flex items-center space-x-1.5">
                      <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-teal-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* ── Input Bar ──────────────────────────────────────────────────── */}
        <div className="shrink-0 pb-4 sm:pb-6 px-2 w-full max-w-3xl mx-auto">
          <div className="relative group shadow-[0_10px_40px_rgba(0,0,0,0.4)] rounded-full border border-white/[0.04]">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
              placeholder="Query the logistics matrix..."
              disabled={isThinking}
              className="w-full bg-[#1A222C] border border-white/[0.05] rounded-full pl-6 pr-32 py-4 sm:py-5 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:bg-[#1E2733] transition-all text-[15px] disabled:opacity-60"
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <button
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || isThinking}
                className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  inputMessage.trim() && !isThinking
                    ? 'bg-teal-500 text-slate-900 shadow-[0_0_15px_rgba(45,212,191,0.5)] hover:bg-teal-400 hover:scale-105'
                    : 'bg-transparent text-slate-500 pointer-events-none'
                }`}
                aria-label="Send Message"
              >
                {isThinking ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 rotate-90 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="mt-3 text-center text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide">
            StackBox AI may produce inaccurate responses regarding proprietary asset data. Verify critical intelligence.
          </div>
        </div>
      </div>
    </div>
  );
}