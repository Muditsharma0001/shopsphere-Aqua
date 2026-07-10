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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
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

          <p className="text-center text-[10px] text-zinc-500 pt-2">
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
