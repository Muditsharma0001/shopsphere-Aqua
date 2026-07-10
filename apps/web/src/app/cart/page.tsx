'use client';

import { useState } from 'react';
import ScrollFoundation from '../../components/ScrollFoundation';
import Navbar from '../../components/Navbar';
import { useCartStore } from '../../store/useCartStore';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeItem,
    moveToWishlist,
    appliedCoupon,
    discountPercent,
    freeShipping,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponCode.trim()) return;

    const result = applyCoupon(couponCode);
    if (result.success) {
      setCouponSuccess(result.message);
      setCouponCode('');
    } else {
      setCouponError(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const shippingCost = subtotal > 150 || freeShipping || subtotal === 0 ? 0 : 9.99;
  const gstAmount = (subtotal - discountAmount) * 0.05;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost + gstAmount);

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        
        {/* Glow meshes */}
        <div className="absolute top-[10%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/2 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/3 rounded-full filter blur-[100px] pointer-events-none" />

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20">
          
          <div className="pb-8 border-b border-zinc-900 mb-12">
            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Shopping Container
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mt-4 font-serif">
              YOUR BAG
            </h1>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-zinc-900 bg-zinc-900/5">
              <span className="text-4xl block mb-4">🛍️</span>
              <p className="text-sm text-zinc-500">Your shopping bag is empty.</p>
              <Link
                href="/shop"
                className="mt-6 inline-block px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Explore Collections
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* Left Column: Cart items list (Col-span 8) */}
              <div className="lg:col-span-8 space-y-4">
                {cart.map((item) => {
                  const mainImage = item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
                  
                  // Color swatch rendering filter class
                  const colorFilters: { [key: string]: string } = {
                    'Silver Matte': '',
                    'Aurora Blue': 'hue-rotate-[145deg] saturate-125',
                    'Velvet Purple': 'hue-rotate-[285deg] saturate-125',
                    'Alpine Gold': 'hue-rotate-[35deg] saturate-125',
                  };
                  const filterClass = colorFilters[item.selectedColor] || '';

                  return (
                    <div
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedCapacity}`}
                      className="p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all"
                    >
                      {/* Product Frame and Info */}
                      <div className="flex gap-4 items-center">
                        <div className="h-20 w-20 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-900 flex items-center justify-center p-3 shrink-0">
                          <img src={mainImage} alt={item.product.name} className={`h-full w-auto object-contain ${filterClass}`} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                            {item.product.name}
                          </h3>
                          <span className="block text-[10px] text-zinc-500 font-medium mt-1">
                            Color: {item.selectedColor} &bull; Size: {item.selectedCapacity}
                          </span>
                        </div>
                      </div>

                      {/* Quantity counter, Price details and actions */}
                      <div className="w-full sm:w-auto flex flex-row sm:flex-row items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-900">
                        {/* Qty increment */}
                        <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedCapacity, item.quantity - 1)}
                            className="h-8 w-8 text-xs text-zinc-400 hover:text-white flex items-center justify-center focus:outline-none"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedCapacity, item.quantity + 1)}
                            className="h-8 w-8 text-xs text-zinc-400 hover:text-white flex items-center justify-center focus:outline-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Prices */}
                        <div className="text-right min-w-[80px]">
                          <span className="block text-xs font-black text-white">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 text-[10px] font-mono font-medium text-zinc-500">
                          <button
                            onClick={() => moveToWishlist(item)}
                            className="hover:text-indigo-400 transition-colors"
                          >
                            ♡ Save
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id, item.selectedColor, item.selectedCapacity)}
                            className="hover:text-red-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Right Column: Checkout details summary (Col-span 4) */}
              <div className="lg:col-span-4 p-6 rounded-3xl border border-zinc-900 bg-zinc-950/40 space-y-6">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Order Summary</h3>

                {/* Coupon application form */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2 pb-4 border-b border-zinc-900">
                  <input
                    type="text"
                    placeholder="PROMO CODE (AQUA20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-[10px] uppercase font-bold text-white placeholder-zinc-700 tracking-wider focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-850 transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {couponError && <p className="text-[9px] text-red-400 font-mono mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-[9px] text-indigo-400 font-mono mt-1">{couponSuccess}</p>}

                {/* Price calculations */}
                <div className="space-y-3 text-xs font-mono text-zinc-400 border-b border-zinc-900 pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-indigo-400 font-semibold">
                      <span>Promo Discount ({appliedCoupon})</span>
                      <div className="flex items-center gap-2">
                        <span>-${discountAmount.toFixed(2)}</span>
                        <button onClick={handleRemoveCoupon} className="text-zinc-600 hover:text-zinc-400 text-[10px] focus:outline-none">✕</button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Carbon Safe Shipping</span>
                    <span className="text-white">
                      {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="text-white">${gstAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Grand Total</span>
                  <span className="text-xl font-black text-white font-mono">${grandTotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => alert('Initiating Stripe payment flow... (Stripe sandbox client overlay launched)')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/10"
                >
                  Proceed to Checkout
                </button>
              </div>

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
