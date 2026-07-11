'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExperienceGatewayWrapper({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check if we just redirected with temporary bypass
    const bypass = sessionStorage.getItem('experienceBypass');
    if (bypass === 'true') {
      sessionStorage.removeItem('experienceBypass');
      setSelected(true);
    }
  }, []);

  const handleCustomerSelect = () => {
    setLoading(true);
    setErrorMsg(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    sessionStorage.setItem('experienceBypass', 'true');
    window.location.href = `${apiUrl}/auth/demo-login?role=CUSTOMER`;
  };

  const handleBusinessSelect = () => {
    setLoading(true);
    setErrorMsg(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    sessionStorage.setItem('experienceBypass', 'true');
    window.location.href = `${apiUrl}/auth/demo-login?role=BUSINESS_OWNER`;
  };

  return (
    <>
      <AnimatePresence>
        {!selected && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#030304] flex flex-col justify-center items-center p-6 overflow-y-auto text-zinc-100 font-sans"
          >
            {/* Ambient background glows */}
            <div className="absolute top-[10%] left-[20%] w-[35vw] h-[35vw] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[20%] w-[35vw] h-[35vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

            <div className="max-w-4xl w-full relative z-10 flex flex-col items-center py-12">
              
              {/* Header Title */}
              <div className="text-center space-y-4 mb-16">
                <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.25em] bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                  Portfolio Showcase Gate
                </span>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mt-4 uppercase">
                  Welcome to HydraFlow
                </h1>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-md mx-auto">
                  Choose how you'd like to experience HydraFlow.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-8 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-center text-xs text-red-400 font-bold uppercase tracking-wider">
                  {errorMsg}
                </div>
              )}

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                
                {/* 1. Customer Card */}
                <div className="relative group rounded-3xl border border-zinc-900 bg-zinc-950/40 p-8 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between min-h-[340px] shadow-2xl">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]">👤</span>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">Customer</h3>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Explore the complete premium shopping experience.
                    </p>
                    <ul className="space-y-1.5 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                      <li>• Browse Products</li>
                      <li>• Wishlist</li>
                      <li>• Cart</li>
                      <li>• Checkout</li>
                      <li>• Track Orders</li>
                      <li>• AI Shopping Assistant</li>
                      <li>• Rewards</li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleCustomerSelect}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center py-3.5 rounded-xl bg-zinc-950 hover:bg-indigo-600 hover:text-white border border-zinc-900 hover:border-indigo-500 text-zinc-400 font-bold text-[9px] uppercase tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Entering Catalog...' : 'Continue as Customer'}
                    </button>
                  </div>
                </div>

                {/* 2. Business Owner Card */}
                <div className="relative group rounded-3xl border border-zinc-900 bg-zinc-950/40 p-8 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between min-h-[340px] shadow-2xl">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]">🏢</span>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">Business Owner</h3>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Manage the complete business.
                    </p>
                    <ul className="space-y-1.5 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                      <li>• Dashboard</li>
                      <li>• Product Library</li>
                      <li>• Product Studio</li>
                      <li>• Website Builder</li>
                      <li>• Orders</li>
                      <li>• Customers</li>
                      <li>• Analytics</li>
                      <li>• AI Studio & Marketing</li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleBusinessSelect}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center py-3.5 rounded-xl bg-zinc-950 hover:bg-indigo-600 hover:text-white border border-zinc-900 hover:border-indigo-500 text-zinc-400 font-bold text-[9px] uppercase tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Entering Corporate Dashboard...' : 'Continue as Business Owner'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render core app layout children only */}
      {children}
    </>
  );
}
