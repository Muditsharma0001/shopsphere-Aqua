'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, CartItem } from '../store/useCartStore';

export default function MiniCart() {
  const {
    cart,
    isCartOpen,
    setCartOpen,
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
  const gstAmount = (subtotal - discountAmount) * 0.05; // 5% GST
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost + gstAmount);

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Dark overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-48 bg-black"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0a0a0c]/90 border-l border-zinc-850 backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-900 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-lg">🛒</span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Shopping Bag</h3>
                  <span className="text-[10px] text-zinc-500 font-mono font-medium block mt-0.5">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="text-zinc-500 hover:text-white text-sm focus:outline-none"
              >
                ✕ Close
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <span className="text-4xl">🛍️</span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Your bag is empty</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] leading-normal">
                      Fill it with our premium Aqua series insulation bottles.
                    </p>
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-2 px-5 py-2.5 rounded-xl border border-zinc-850 hover:border-zinc-750 bg-zinc-950 text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-all"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item, index) => {
                  const mainImage = item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                  
                  // Color variant styling filter
                  const colorFilters: { [key: string]: string } = {
                    'Silver Matte': '',
                    'Aurora Blue': 'hue-rotate-[145deg] saturate-125',
                    'Velvet Purple': 'hue-rotate-[285deg] saturate-125',
                    'Alpine Gold': 'hue-rotate-[35deg] saturate-125',
                  };
                  const filterClass = colorFilters[item.selectedColor] || '';

                  return (
                    <motion.div
                      layout
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedCapacity}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 flex gap-4 transition-all"
                    >
                      {/* Image Frame */}
                      <div className="h-16 w-16 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 shrink-0 flex items-center justify-center p-2 relative">
                        <img src={mainImage} alt={item.product.name} className={`h-full w-auto object-contain ${filterClass}`} />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-[11px] font-bold text-white uppercase tracking-wide line-clamp-1">
                              {item.product.name}
                            </h5>
                            <span className="text-[11px] font-black text-white shrink-0">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <span className="block text-[9px] text-zinc-500 font-medium mt-0.5">
                            {item.selectedColor} &bull; {item.selectedCapacity}
                          </span>
                        </div>

                        {/* Quantity Counter & Action Buttons */}
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-900/60">
                          {/* Counter */}
                          <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedCapacity, item.quantity - 1)}
                              className="h-6 w-6 text-[10px] text-zinc-500 hover:text-white flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-[10px] font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedCapacity, item.quantity + 1)}
                              className="h-6 w-6 text-[10px] text-zinc-500 hover:text-white flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-3 text-[9px] font-mono font-medium text-zinc-500">
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
                              ✕ Remove
                            </button>
                          </div>
                        </div>

                      </div>

                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Calculations & Checkout Panel (Shrink-0) */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-900 bg-[#070709] shrink-0 space-y-4">
                
                {/* Promo Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
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

                {couponError && <p className="text-[9px] text-red-400 font-mono">{couponError}</p>}
                {couponSuccess && <p className="text-[9px] text-indigo-400 font-mono">{couponSuccess}</p>}

                {/* Subtotals & Taxes breakdown */}
                <div className="space-y-2 text-[10px] font-mono text-zinc-400 border-b border-zinc-900 pb-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-indigo-400 font-semibold">
                      <span>Promo Discount ({appliedCoupon})</span>
                      <div className="flex items-center gap-2">
                        <span>-${discountAmount.toFixed(2)}</span>
                        <button onClick={handleRemoveCoupon} className="text-zinc-600 hover:text-zinc-400 text-[9px] focus:outline-none">✕</button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Carbon-neutral Shipping</span>
                    <span className="text-white">
                      {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="text-white">${gstAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Grand Total</span>
                  <span className="text-lg font-black text-white font-mono">${grandTotal.toFixed(2)}</span>
                </div>

                {/* Checkout Trigger */}
                <button
                  onClick={() => alert('Initiating Stripe premium payment overlay...')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/10"
                >
                  Proceed to Checkout
                </button>

              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
