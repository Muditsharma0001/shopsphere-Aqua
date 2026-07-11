'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ScrollFoundation from '../../components/ScrollFoundation';
import Navbar from '../../components/Navbar';

export default function PortalGateway() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const portalCards = [
    {
      id: 'customer',
      icon: '👤',
      title: 'Customer',
      desc: 'Purchase premium water bottles. Track orders. Manage profile. Wishlist. Rewards. AI Shopping Assistant.',
      tags: ['Storefront', 'Orders', 'Wishlist', 'Rewards', 'AI Shopping Assistant'],
      btnLabel: 'Continue as Customer',
      href: isDemo ? `${apiUrl}/auth/demo-login?role=CUSTOMER` : '/login?role=CUSTOMER',
    },
    {
      id: 'business',
      icon: '🏢',
      title: 'Business Owner',
      desc: 'Manage the entire business. Products. Orders. Customers. Website. Analytics. Marketing. Inventory.',
      tags: ['Business OS', 'Product Studio', 'Website Builder', 'CRM', 'Finance', 'Security'],
      btnLabel: 'Continue as Business Owner',
      href: isDemo ? `${apiUrl}/auth/demo-login?role=BUSINESS_OWNER` : '/business/login?role=BUSINESS_OWNER',
    },
  ];

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative flex flex-col justify-center items-center">
        {/* Ambient luxury glows */}
        <div className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[15%] right-[15%] w-[35vw] h-[35vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

        {isDemo && (
          <div className="fixed top-2 left-2 z-50 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-bold text-indigo-400 uppercase tracking-widest pointer-events-none">
            Portfolio Demo Mode
          </div>
        )}

        <Navbar />

        <main className="max-w-4xl w-full px-6 pt-36 pb-24 relative z-20 flex flex-col items-center">
          {/* Choice Header */}
          <div className="text-center max-w-2xl space-y-4 mb-16">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.25em] bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              Platform Gate
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mt-4">
              CHOOSE YOUR EXPERIENCE
            </h1>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-md mx-auto">
              Select your access profile pathway below to either browse customer retail catalog shelves or manage operational logistics via the Business OS.
            </p>
          </div>

          {/* Experience Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {portalCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                className="relative group rounded-3xl border border-zinc-900 bg-zinc-950/40 p-8 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between min-h-[300px] shadow-2xl"
              >
                {/* Glowing border sweep */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]">{card.icon}</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">{card.title}</h3>
                  </div>

                  <p className="text-zinc-400 text-xs leading-relaxed">{card.desc}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-850/60 text-[8px] font-bold text-zinc-500 uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    href={card.href}
                    className="w-full inline-flex items-center justify-center py-3.5 rounded-xl bg-zinc-950 hover:bg-indigo-600 hover:text-white border border-zinc-900 hover:border-indigo-500 text-zinc-400 font-bold text-[9px] uppercase tracking-widest transition-all duration-300 select-none cursor-pointer"
                  >
                    {card.btnLabel}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </ScrollFoundation>
  );
}
