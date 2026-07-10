'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ScrollFoundation from '../../components/ScrollFoundation';
import Navbar from '../../components/Navbar';

const portalCards = [
  {
    id: 'customer',
    icon: '👤',
    title: 'Customer Portal',
    desc: 'Access your order history, activate warranties, track points, and configure default delivery addresses.',
    tags: ['Browse catalog', 'Orders', 'Wishlist', 'Profile Settings'],
    btnLabel: 'Enter Customer Portal',
    href: '/',
  },
  {
    id: 'seller',
    icon: '🏪',
    title: 'Seller Portal',
    desc: 'Oversee merchant inventory catalogs, review retail metrics, customize discounts, and converse with buyers.',
    tags: ['Catalog editor', 'Store statistics', 'Coupons', 'Inbox'],
    btnLabel: 'Seller Login',
    href: '/seller/login',
  },
  {
    id: 'enterprise',
    icon: '🏢',
    title: 'Enterprise Portal',
    desc: 'Coordinate operations across multiple storefronts, review warehouse logistics, manage regional employees, and download financial reports.',
    tags: ['Multi-store', 'Warehouses', 'Corporate settings', 'Audits'],
    btnLabel: 'Enterprise Login',
    href: '/enterprise/login',
  },
  {
    id: 'admin',
    icon: '🛡️',
    title: 'Administrator Portal',
    desc: 'Moderate user accounts, approve seller catalog entries, track global system logs, and inspect platform security performance indices.',
    tags: ['Platform audit', 'Bans/Approvals', 'Categories CRUD', 'Logs'],
    btnLabel: 'Admin Login',
    href: '/admin/login',
  },
];

export default function PortalGateway() {
  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        {/* Abstract luxury ambient glows */}
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />
        
        {/* Luxury grid texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZHRoPSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii41Ii8+Cjwvc3ZnPg==')]" />

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20 flex flex-col items-center">
          {/* Header Title Section */}
          <div className="text-center max-w-2xl space-y-4 mb-16">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.25em] bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              Corporate Gateway
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight mt-4">
              UNIFIED MULTI-PORTAL<br />CONTROL HUB
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Authenticate into your authorized profile dashboard to manage logistics, inspect inventories, or edit retail metrics across the HydraFlow platform.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            {portalCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                className="relative group rounded-3xl border border-zinc-900 bg-zinc-950/40 p-8 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between min-h-[300px] shadow-2xl"
              >
                {/* Glowing Border Sweep */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="space-y-5">
                  {/* Card Title & Icon */}
                  <div className="flex items-center gap-4">
                    <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]">{card.icon}</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">{card.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-zinc-400 text-xs leading-relaxed">{card.desc}</p>

                  {/* Tags */}
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

                {/* Call To Action button */}
                <div className="pt-6">
                  <Link
                    href={card.href}
                    className="w-full inline-flex items-center justify-center py-3 rounded-xl bg-zinc-950 hover:bg-indigo-600 hover:text-white border border-zinc-900 hover:border-indigo-500 text-zinc-400 font-bold text-[9px] uppercase tracking-widest transition-all duration-300 select-none cursor-pointer"
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
