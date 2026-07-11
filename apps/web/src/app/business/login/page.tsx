'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';

function BusinessLoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password flow
  const [forgotFlow, setForgotFlow] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    window.location.href = `${apiUrl}/auth/google?role=BUSINESS_OWNER`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Login credentials incorrect.');
      }

      if (data.data?.role !== 'BUSINESS_OWNER') {
        throw new Error('Access denied. Business Owner role is required to manage the Operating System.');
      }

      setSuccessMsg('Authentication successful! Opening Business OS...');
      setTimeout(() => {
        window.location.href = '/business/dashboard';
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server authentication error.');
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'Recovery code generated.');
        setTimeout(() => {
          setForgotFlow(false);
          setSuccessMsg(null);
        }, 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Recovery submit failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative flex items-center justify-center">
      {/* Glow meshes */}
      <div className="absolute top-[15%] left-[20%] w-[35vw] h-[35vw] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      
      <Navbar />

      <div className="w-full max-w-md px-6 py-12 relative z-20">
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40 p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="text-center">
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.25)]">🏢</span>
            <h2 className="mt-4 text-xl font-black text-white uppercase tracking-wider">Business Owner Sign In</h2>
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest mt-1 font-bold">ShopSphere Business OS</p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-center text-xs text-red-400 font-bold uppercase tracking-wider">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-center text-xs text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
              {successMsg}
            </div>
          )}

          {!forgotFlow ? (
            <div className="space-y-6">
              {/* Google login option */}
              <div>
                <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all duration-300 hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Glassmorphic Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-[9px] text-zinc-550 uppercase tracking-widest font-black">OR</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              {/* Traditional credentials form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Business Email</label>
                  <input
                    type="email"
                    placeholder="owner@shopsphere.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotFlow(true)}
                      className="text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest font-bold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[9px] text-zinc-400 uppercase tracking-widest font-bold">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-zinc-900 bg-zinc-950 text-indigo-600 focus:ring-0"
                    />
                    Remember Me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Recovery Email</label>
                <input
                  type="email"
                  placeholder="owner@shopsphere.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Submitting request...' : 'Send Recovery Link'}
              </button>

              <button
                type="button"
                onClick={() => setForgotFlow(false)}
                className="w-full text-center text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-bold pt-2"
              >
                ← Return to Sign In
              </button>
            </form>
          )}

          <p className="text-center text-[10px] text-zinc-550 pt-2">
            <Link href="/portal" className="hover:text-indigo-400 transition-colors">
              ← Return to Control Gateways
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BusinessLogin() {
  return (
    <ScrollFoundation>
      <Suspense fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans antialiased">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-zinc-400 text-sm">Loading session...</p>
          </div>
        </div>
      }>
        <BusinessLoginContent />
      </Suspense>
    </ScrollFoundation>
  );
}
