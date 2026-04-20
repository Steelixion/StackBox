'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Login failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@stackbox.ai');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-deep-ink">
      {/* ── Left Panel ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 relative overflow-hidden p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(45, 212, 191, 0.15) 0%, transparent 70%),
              linear-gradient(rgba(45, 212, 191, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(45, 212, 191, 0.05) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-jade/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-jade/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-lg text-porcelain space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-jade shadow-[var(--drop-shadow-glow-jade)] flex items-center justify-center">
              <svg className="w-6 h-6 text-deep-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">StackBox AI</h1>
          </div>

          <h2 className="text-3xl font-semibold leading-snug">
            Next-Generation <br /> Warehouse & Inventory Platform
          </h2>
          <p className="text-steel text-lg">
            Master your supply chain with real-time tracking, AI-driven insights, and seamless inventory trading grounded in precision.
          </p>

          {/* Demo Credentials Card */}
          <div className="mt-8 bg-jade/10 border border-jade/30 rounded-xl p-5">
            <p className="text-xs font-bold text-jade uppercase tracking-wider mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Demo Credentials
            </p>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-steel/70">Email</span>
                <span className="text-porcelain">admin@stackbox.ai</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-steel/70">Password</span>
                <span className="text-porcelain">admin123</span>
              </div>
            </div>
          </div>

          {/* Session note */}
          <div className="flex items-start space-x-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <svg className="w-5 h-5 text-jade flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-xs text-steel/80 leading-relaxed">
              Your session is stored in an <span className="text-jade font-semibold">httpOnly cookie</span> for 7 days — you won&apos;t need to sign in again on the same device.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ──────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-porcelain p-8 sm:p-12 lg:p-24 shadow-2xl z-10">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center justify-center space-x-2 lg:hidden">
            <div className="w-8 h-8 rounded bg-jade shadow-[var(--drop-shadow-glow-jade)] flex items-center justify-center">
              <svg className="w-5 h-5 text-deep-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-deep-ink">StackBox <span className="text-jade">AI</span></span>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-deep-ink tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-sm text-steel">Sign in to access your warehouse dashboard</p>
          </div>

          {/* ── Email / Password Form ──────────────────────────────────── */}
          <form onSubmit={handleCredentialLogin} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-center space-x-2 bg-cinnabar/10 border border-cinnabar/30 rounded-lg px-4 py-3 animate-in fade-in duration-200">
                <svg className="w-4 h-4 text-cinnabar flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-cinnabar font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-deep-ink mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stackbox.ai"
                className="block w-full px-4 py-3 border border-steel/30 rounded-lg text-deep-ink placeholder-steel/40 bg-white focus:outline-none focus:ring-2 focus:ring-jade focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-deep-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 pr-11 border border-steel/30 rounded-lg text-deep-ink placeholder-steel/40 bg-white focus:outline-none focus:ring-2 focus:ring-jade focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-steel hover:text-deep-ink transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs text-jade hover:text-jade/80 font-medium transition-colors flex items-center"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Fill demo credentials
              </button>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setError('Password reset is not available in demo mode.');
                }}
                className="text-xs font-medium text-steel hover:text-deep-ink transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-bold text-deep-ink bg-jade hover:shadow-[var(--drop-shadow-glow-jade)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-deep-ink border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-steel/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-porcelain text-steel">or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <GoogleLoginButton />

          <p className="text-center text-xs text-steel/60 leading-relaxed">
            By signing in you agree to our{' '}
            <a href="#" className="text-jade hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-jade hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
