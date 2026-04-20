'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-deep-ink selection:bg-jade/30 text-porcelain font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Core Radial Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-jade/10 rounded-full blur-[150px] opacity-60 mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vh] bg-cinnabar/10 rounded-full blur-[150px] opacity-50 mix-blend-screen" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(248, 250, 252, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(248, 250, 252, 1) 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
            backgroundPosition: 'center center',
          }}
        />

        {/* Floating Particles (CSS approximated) */}
        <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-jade rounded-full shadow-[var(--drop-shadow-glow-jade)] animate-pulse" />
        <div className="absolute top-[60%] right-[20%] w-2 h-2 bg-cinnabar rounded-full shadow-[var(--drop-shadow-glow-cinnabar)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] left-[30%] w-1.5 h-1.5 bg-porcelain rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation - Glassmorphic */}
      <nav className="fixed top-0 w-full z-50 bg-deep-ink/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-jade to-deep-ink p-[1px] shadow-[var(--drop-shadow-glow-jade)] transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-deep-ink rounded-[11px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tighter text-porcelain">
                StackBox<span className="text-jade">.AI</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm font-medium text-steel hover:text-jade transition-colors">Core Systems</Link>
              <Link href="#features" className="text-sm font-medium text-steel hover:text-jade transition-colors">Predictive Models</Link>
              <Link href="#features" className="text-sm font-medium text-steel hover:text-jade transition-colors">Architecture</Link>
            </div>
            
            <div className="flex items-center space-x-5">
              <Link href="/login" className="text-sm font-medium text-porcelain hover:text-jade transition-colors hidden sm:block">
                System Status
              </Link>
              <Link 
                href="/login" 
                className="relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg bg-cinnabar px-6 font-medium text-white shadow-[var(--drop-shadow-glow-cinnabar)] transition-transform hover:scale-105 hover:bg-cinnabar-dark focus:outline-none focus:ring-2 focus:ring-cinnabar focus:ring-offset-2 focus:ring-offset-deep-ink"
              >
                <span className="relative z-10 text-sm font-bold">Employee Login</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 pt-24 sm:pt-32">
        
        {/* Full Screen Hero Container */}
        <section className="relative min-h-[calc(100vh-8rem)] flex flex-col justify-center items-center pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-jade/10 border border-jade/20 text-jade text-xs font-semibold uppercase tracking-wider mb-8 shadow-[var(--drop-shadow-glow-jade)] backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jade opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-jade"></span>
              </span>
              <span>Internal Intelligence Network Active</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              <span className="block text-porcelain">StackBox Asset</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-jade via-porcelain to-jade animate-pulse-slow">
                Predictive Command.
              </span>
            </h1>
            
            <p className="max-w-2xl text-lg sm:text-xl text-steel mb-12 font-medium leading-relaxed">
              The proprietary centralized intelligence engine for StackBox Company managers. Fuse real-time facility telemetry, predictive routing models, and automated OCR ingestion into a single operational truth.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <Link 
                href="/login" 
                className="w-full sm:w-auto relative group flex items-center justify-center px-8 py-4 font-bold text-white bg-cinnabar rounded-xl shadow-[var(--drop-shadow-glow-cinnabar)] transition-all hover:bg-cinnabar-dark hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cinnabar focus:ring-offset-2 focus:ring-offset-deep-ink"
              >
                <span>Access Dashboard</span>
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link 
                href="#features" 
                className="w-full sm:w-auto group flex items-center justify-center px-8 py-4 font-bold text-porcelain bg-deep-ink-light border border-steel/20 rounded-xl hover:bg-white/5 hover:border-jade/30 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-jade focus:ring-offset-2 focus:ring-offset-deep-ink"
              >
                <span>System Architecture</span>
              </Link>
            </div>
          </div>

          {/* Abstract Interface Preview */}
          <div className="mt-28 md:mt-36 w-full max-w-6xl mx-auto px-4 sm:px-6 relative perspective-[2000px]">
            {/* Ambient glow behind preview */}
            <div className="absolute inset-0 bg-jade/10 blur-[100px] rounded-full" />
            
            <div className="relative rounded-2xl border border-white/10 bg-deep-ink/80 backdrop-blur-2xl shadow-2xl overflow-hidden transform rotateX-[10deg] scale-95 hover:rotate-0 hover:scale-100 transition-all duration-700 ease-out border-b-0 rounded-b-none h-[40vh]">
              
              {/* Fake Window Header */}
              <div className="flex items-center px-4 py-3 border-b border-white/5 bg-deep-ink">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-cinnabar/80" />
                  <div className="w-3 h-3 rounded-full bg-steel/50" />
                  <div className="w-3 h-3 rounded-full bg-jade/80" />
                </div>
                <div className="mx-auto px-4 py-1 rounded-md bg-white/5 text-[10px] text-steel font-mono tracking-widest uppercase">
                  StackBox AI Workspace
                </div>
              </div>
              
              {/* Fake Dashboard Content */}
              <div className="p-6 grid grid-cols-3 gap-6 opacity-80 h-full">
                <div className="col-span-1 space-y-4">
                  <div className="h-24 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-4 flex flex-col justify-between">
                    <div className="w-1/2 h-2 bg-steel/20 rounded" />
                    <div className="w-3/4 h-8 bg-jade/20 rounded" />
                  </div>
                  <div className="h-48 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-4">
                    <div className="w-1/3 h-2 bg-steel/20 rounded mb-4" />
                    <div className="space-y-2">
                      <div className="w-full h-8 bg-white/5 rounded" />
                      <div className="w-full h-8 bg-white/5 rounded" />
                      <div className="w-full h-8 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
                <div className="col-span-2 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 relative overflow-hidden">
                  <div className="w-1/4 h-2 bg-steel/20 rounded mb-8" />
                  {/* Fake Chart Lines */}
                  <svg className="w-full h-full text-jade/20 absolute bottom-0 left-0 drop-shadow-[var(--drop-shadow-glow-jade)]" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path fill="none" stroke="currentColor" strokeWidth="2" d="M0,80 Q10,70 20,80 T40,60 T60,70 T80,40 T100,50" />
                    <path fill="currentColor" opacity="0.1" d="M0,80 Q10,70 20,80 T40,60 T60,70 T80,40 T100,50 L100,100 L0,100 Z" />
                  </svg>
                </div>
              </div>
              {/* Grandient overlay to fade bottom */}
              <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-deep-ink to-transparent" />
            </div>
          </div>
        </section>

        {/* Cinematic Features Grid */}
        <section id="features" className="py-32 sm:py-40 relative z-10 border-t border-white/5 bg-deep-ink">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-24 sm:mb-32 text-center max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-porcelain">
                Engineered for <span className="text-jade">Control.</span>
              </h2>
              <p className="mt-8 text-xl sm:text-2xl text-steel font-light leading-relaxed">
                Every component is crafted following the Wuxing philosophy: creating harmonious flow while offering absolute structural control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
              {/* Card 1 */}
              <div className="group relative rounded-2xl bg-deep-ink-light border border-white/5 p-8 overflow-hidden hover:border-jade/30 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-jade/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-jade/10 border border-jade/20 flex flex-col items-center justify-center mb-8 group-hover:shadow-[var(--drop-shadow-glow-jade)] transition-shadow duration-500">
                    <svg className="w-6 h-6 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-porcelain mb-4">Neural Data Ingestion</h3>
                  <p className="text-steel leading-relaxed">
                    Transform incoming paper bills of lading and invoices into structured internal telemetry instantly. Eliminate data-entry friction for floor operators.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative rounded-2xl bg-deep-ink-light border border-white/5 p-8 overflow-hidden hover:border-cinnabar/30 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-cinnabar/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-cinnabar/10 border border-cinnabar/20 flex flex-col items-center justify-center mb-8 group-hover:shadow-[var(--drop-shadow-glow-cinnabar)] transition-shadow duration-500">
                    <svg className="w-6 h-6 text-cinnabar" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-porcelain mb-4">AI Predictive Forecasting</h3>
                  <p className="text-steel leading-relaxed">
                    Utilize internal historical trends to predict regional stock shortages before they occur. Generate actionable reallocation alerts for fleet managers.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative rounded-2xl bg-deep-ink-light border border-white/5 p-8 overflow-hidden hover:border-porcelain/30 transition-colors duration-500 lg:col-span-1 md:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-br from-porcelain/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-porcelain/10 border border-porcelain/20 flex flex-col items-center justify-center mb-8">
                    <svg className="w-6 h-6 text-porcelain" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-porcelain mb-4">Live Logistics Matrix</h3>
                  <p className="text-steel leading-relaxed">
                    Track the entire StackBox fleet in real-time. Automatically cross-reference transit schedules against global traffic anomalies to project accurate ETAs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Full Width Strip */}
        <section className="relative py-32 sm:py-40 border-t border-white/5 bg-deep-ink overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-jade/5 to-transparent opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-jade/10 blur-[150px] pointer-events-none" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-5xl md:text-7xl font-extrabold text-porcelain mb-8 tracking-tight">
              Authorized Personnel Only.
            </h2>
            <p className="text-2xl text-steel mb-14 font-light max-w-3xl mx-auto leading-relaxed">
              This system contains proprietary strategic data for StackBox Company management. 
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-10 py-5 font-bold text-white bg-cinnabar rounded-xl shadow-[var(--drop-shadow-glow-cinnabar)] transition-all hover:bg-cinnabar-dark hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cinnabar focus:ring-offset-2 focus:ring-offset-deep-ink text-lg"
            >
              Access Portal
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 bg-deep-ink border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center opacity-80">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-jade/10 border border-jade/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-jade" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-porcelain tracking-tight">StackBox<span className="text-jade">.AI</span></span>
          </div>
          
          <div className="text-steel text-sm text-center md:text-right">
            &copy; 2026 StackBox AI Architecture.<br/>
            Engineered with <span className="text-jade">Jade</span> & <span className="text-cinnabar">Cinnabar</span>.
          </div>
        </div>
      </footer>
    </div>
  );
}
