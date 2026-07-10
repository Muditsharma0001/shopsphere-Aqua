'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') || 'CUSTOMER';
  const role = roleParam.toUpperCase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password sub-flow state
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

      // Check role authorization
      if (role === 'BUSINESS_OWNER' && data.data?.role !== 'BUSINESS_OWNER') {
        throw new Error('Unauthorized role level. This path is restricted to Business Owners.');
      }

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      setSuccessMsg('Authentication successful! Routing to portal workspace...');
      setTimeout(() => {
        window.location.href = role === 'BUSINESS_OWNER' ? '/business/dashboard' : '/';
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server login error.');
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
        setSuccessMsg(data.message || 'Password reset link has been dispatched.');
        setTimeout(() => {
          setForgotFlow(false);
          setSuccessMsg(null);
        }, 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to submit forgot password request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-950 px-6 py-12 lg:px-8 text-zinc-100 font-sans antialiased relative overflow-hidden">
      {/* Ambient luxury glows */}
      <div className="absolute top-[10%] left-[25%] w-[35vw] h-[35vw] bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
          {forgotFlow ? 'Reset Password' : 'Sign In to ShopSphere'}
        </h2>
        <p className="mt-2 text-center text-xs text-indigo-400 uppercase tracking-widest font-bold">
          Portal Access: {role}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm px-6 py-8 shadow-xl sm:px-10">
          
          {errorMsg && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-xs text-red-400 font-bold uppercase tracking-wider">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-xs text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
              {successMsg}
            </div>
          )}

          {!forgotFlow ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Password</label>
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
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Recovery Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
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

          {role === 'CUSTOMER' && !forgotFlow && (
            <div className="mt-6 text-center text-[10px] text-zinc-500">
              <span>New to ShopSphere? </span>
              <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Create an account
              </Link>
            </div>
          )}

          <div className="mt-4 text-center text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
            <Link href="/portal" className="hover:text-indigo-400 transition-colors">
              ← Return to Experience Selector
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans antialiased">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-zinc-400 text-sm">Loading session...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
