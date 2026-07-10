'use client';

import { useState } from 'react';
import ScrollFoundation from '../../components/ScrollFoundation';
import Navbar from '../../components/Navbar';
import { useCartStore } from '../../store/useCartStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, moveToCart } = useCartStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareWishlist = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Wishlist link copied to clipboard!');
    }
  };

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        
        {/* Ambient background glows */}
        <div className="absolute top-[10%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/2 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Global Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: -50, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -50, x: '-50%', opacity: 0 }}
              className="fixed top-24 left-1/2 z-50 px-5 py-3 rounded-full border border-indigo-500/30 bg-zinc-950/80 backdrop-blur text-xs text-white font-bold tracking-wider uppercase shadow-xl flex items-center gap-2"
            >
              <span className="text-indigo-400">✓</span> {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-900 mb-12">
            <div>
              <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Bookmarks Collection
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mt-4 font-serif">
                YOUR WISHLIST
              </h1>
            </div>

            {wishlist.length > 0 && (
              <button
                onClick={handleShareWishlist}
                className="px-5 py-3 rounded-xl border border-zinc-850 hover:border-zinc-750 bg-zinc-900/40 hover:bg-zinc-900/60 text-xs font-bold text-zinc-300 uppercase tracking-widest transition-all"
              >
                🔗 Share Wishlist
              </button>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-zinc-900 bg-zinc-900/5">
              <span className="text-4xl block mb-4">🤍</span>
              <p className="text-sm text-zinc-500">Your wishlist is currently empty.</p>
              <Link
                href="/shop"
                className="mt-6 inline-block px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Explore Collections
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {wishlist.map((product) => {
                const imgUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
                
                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950/20 hover:border-zinc-850 hover:bg-zinc-900/10 transition-all duration-300"
                  >
                    {/* Visual box */}
                    <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center p-4">
                      <img src={imgUrl} alt={product.name} className="h-[75%] w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full border border-zinc-850 bg-zinc-950/70 backdrop-blur flex items-center justify-center text-xs text-red-500 hover:border-zinc-700 transition-colors focus:outline-none"
                      >
                        ❤️
                      </button>
                    </div>

                    {/* Details and CTAs */}
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-semibold text-white tracking-wide uppercase line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {product.name}
                          </h4>
                          <span className="text-xs font-black text-white">${product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed mt-2">{product.description}</p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-900/60 flex gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="flex-1 py-2.5 text-center text-[9px] font-bold uppercase tracking-widest rounded-xl border border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white transition-colors"
                        >
                          Specs
                        </Link>
                        <button
                          onClick={() => {
                            moveToCart(product);
                            triggerToast('Moved item to cart!');
                          }}
                          className="flex-1 py-2.5 text-center text-[9px] font-bold uppercase tracking-widest rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                          Move To Cart
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>

        <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-center text-xs text-zinc-500 mt-24">
          <p>&copy; 2026 ShopSphere Aqua Inc. All rights reserved.</p>
        </footer>

      </div>
    </ScrollFoundation>
  );
}
