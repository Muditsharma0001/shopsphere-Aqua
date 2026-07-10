'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@shopsphere/shared-types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedCapacity: string;
}

interface CartState {
  cart: CartItem[];
  wishlist: Product[];
  appliedCoupon: string | null;
  discountPercent: number;
  freeShipping: boolean;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  
  // Cart Actions
  addItem: (product: Product, quantity: number, color: string, capacity?: string) => void;
  removeItem: (productId: string, color: string, capacity: string) => void;
  updateQuantity: (productId: string, color: string, capacity: string, quantity: number) => void;
  clearCart: () => void;
  
  // Wishlist Actions
  toggleWishlist: (product: Product) => void;
  moveToWishlist: (item: CartItem) => void;
  moveToCart: (product: Product) => void;
  
  // Coupon Actions
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      appliedCoupon: null,
      discountPercent: 0,
      freeShipping: false,
      isCartOpen: false,
      setCartOpen: (open) => set({ isCartOpen: open }),

      addItem: (product, quantity, color, capacity = '24oz / 710ml') => {
        const currentCart = get().cart;
        const existingIndex = currentCart.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedColor === color &&
            item.selectedCapacity === capacity
        );

        if (existingIndex > -1) {
          const updatedCart = [...currentCart];
          updatedCart[existingIndex].quantity += quantity;
          set({ cart: updatedCart });
        } else {
          set({
            cart: [
              ...currentCart,
              {
                product,
                quantity,
                selectedColor: color,
                selectedCapacity: capacity,
              },
            ],
          });
        }
      },

      removeItem: (productId, color, capacity) => {
        set({
          cart: get().cart.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedColor === color &&
                item.selectedCapacity === capacity
              )
          ),
        });
      },

      updateQuantity: (productId, color, capacity, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, capacity);
          return;
        }
        set({
          cart: get().cart.map((item) =>
            item.product.id === productId &&
            item.selectedColor === color &&
            item.selectedCapacity === capacity
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ cart: [], appliedCoupon: null, discountPercent: 0, freeShipping: false }),

      toggleWishlist: (product) => {
        const currentWish = get().wishlist;
        const exists = currentWish.some((p) => p.id === product.id);
        if (exists) {
          set({ wishlist: currentWish.filter((p) => p.id !== product.id) });
        } else {
          set({ wishlist: [...currentWish, product] });
        }
      },

      moveToWishlist: (item) => {
        get().removeItem(item.product.id, item.selectedColor, item.selectedCapacity);
        const currentWish = get().wishlist;
        if (!currentWish.some((p) => p.id === item.product.id)) {
          set({ wishlist: [...currentWish, item.product] });
        }
      },

      moveToCart: (product) => {
        set({ wishlist: get().wishlist.filter((p) => p.id !== product.id) });
        get().addItem(product, 1, 'Silver Matte');
      },

      applyCoupon: (code) => {
        const sanitized = code.trim().toUpperCase();
        if (sanitized === 'AQUA20') {
          set({ appliedCoupon: 'AQUA20', discountPercent: 20 });
          return { success: true, message: '20% discount applied successfully!' };
        }
        if (sanitized === 'FREESHIP') {
          set({ appliedCoupon: 'FREESHIP', freeShipping: true });
          return { success: true, message: 'Free shipping applied!' };
        }
        return { success: false, message: 'Invalid coupon code.' };
      },

      removeCoupon: () => set({ appliedCoupon: null, discountPercent: 0, freeShipping: false }),
    }),
    {
      name: 'shopsphere-cart-store',
    }
  )
);
