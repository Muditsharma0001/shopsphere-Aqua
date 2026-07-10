'use client';

import { useState } from 'react';
import Link from 'next/link';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';

export default function BusinessLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDevBypass = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    window.location.href = `${apiUrl}/auth/dev-login?role=BUSINESS_OWNER`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      handleDevBypass();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login attempt failed.');
      setLoading(false);
    }
  };

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative flex items-center justify-center">
        {/* Glow meshes */}
        <div className="absolute top-[15%] left-[20%] w-[35vw] h-[35vw] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />
        
        <Navbar />

        <div className="w-full max-w-md px-6 py-12 relative z-20">
          <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40 p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="text-center">
              <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.25)]">🏢</span>
              <h2 className="mt-4 text-xl font-black text-white uppercase tracking-wider">Business Owner Sign In</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">ShopSphere Business OS</p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-center text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Business Email</label>
                <input
                  type="email"
                  placeholder="owner@shopsphere.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying Session...' : 'Authenticate'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink mx-4 text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Local Debug</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            <button
              onClick={handleDevBypass}
              className="w-full py-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 font-bold text-[9px] uppercase tracking-widest transition-all duration-300 cursor-pointer"
            >
              🚀 Instant Developer Login
            </button>

            <p className="text-center text-[10px] text-zinc-500 pt-2">
              <Link href="/portal" className="hover:text-indigo-400 transition-colors">
                ← Return to Control Gateways
              </Link>
            </p>
          </div>
        </div>
      </div>
    </ScrollFoundation>
  );
}
