'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';

interface NavbarProps {
  onSearchClick?: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const cart = useCartStore((state) => state.cart);
  const wishlist = useCartStore((state) => state.wishlist);
  const setCartOpen = useCartStore((state) => state.setCartOpen);
  const { theme, toggleTheme } = useThemeStore();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-45 w-[92%] max-w-5xl rounded-full border transition-all duration-500 ${
        scrolled
          ? 'bg-[var(--bg-surface)] backdrop-blur-xl border-[var(--border-primary)] py-3 shadow-lg shadow-black/10'
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="mx-auto flex items-center justify-between px-6 md:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] transition-transform duration-500 group-hover:rotate-180">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
              <span className="text-sm font-extrabold text-white">S</span>
            </div>
          </div>
          <span className="text-base font-black tracking-tight text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
            SHOPSPHERE
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 relative py-1 group"
          >
            Showcase
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link
            href="/#materials"
            className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 relative py-1 group"
          >
            Materials
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link
            href="/#temp-retention"
            className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 relative py-1 group"
          >
            Thermal
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link
            href="/#exploded-view"
            className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 relative py-1 group"
          >
            Design
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link
            href="/shop"
            className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 relative py-1 group"
          >
            Shop
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>

        {/* Action Buttons & CTA */}
        <div className="hidden md:flex items-center gap-2">
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="p-2 h-9 w-9 rounded-full border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs flex items-center justify-center cursor-pointer"
              title="Search Products"
            >
              🔍
            </button>
          )}
          
          <Link
            href="/wishlist"
            className="relative p-2 h-9 w-9 rounded-full border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs flex items-center justify-center"
            title="Wishlist"
          >
            🤍
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-pink-500 border border-zinc-950" />
            )}
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 h-9 w-9 rounded-full border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs flex items-center justify-center cursor-pointer"
            title="Shopping Cart"
          >
            🛍️
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-indigo-600 text-white text-[8px] font-black flex items-center justify-center border border-zinc-950 animate-scaleIn">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Theme switcher toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 h-9 w-9 rounded-full border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs flex items-center justify-center cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Customer Dashboard Link */}
          <Link
            href="/dashboard"
            className="p-2 h-9 w-9 rounded-full border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs flex items-center justify-center"
            title="Customer Portal"
          >
            👤
          </Link>

          <Link
            href="/shop"
            className="relative ml-2 px-5 py-2 rounded-full overflow-hidden text-xs font-bold text-white tracking-widest uppercase transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] group bg-zinc-900 border border-zinc-800"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
            <span className="relative z-10 text-white">Get Aqua</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden h-8 w-8 flex-col justify-center items-center gap-1.5 focus:outline-none"
        >
          <span
            className={`h-[2px] w-5 bg-[var(--text-primary)] rounded-full transition-transform duration-300 ${
              mobileMenuOpen ? 'rotate-45 translate-y-[8px]' : ''
            }`}
          />
          <span
            className={`h-[2px] w-5 bg-[var(--text-primary)] rounded-full transition-opacity duration-300 ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`h-[2px] w-5 bg-[var(--text-primary)] rounded-full transition-transform duration-300 ${
              mobileMenuOpen ? '-rotate-45 -translate-y-[8px]' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`absolute top-full left-0 right-0 mt-3 rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-surface)] backdrop-blur-2xl p-6 transition-all duration-500 md:hidden flex flex-col gap-4 shadow-2xl ${
          mobileMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)]"
        >
          Showcase
        </Link>
        <Link
          href="/#materials"
          onClick={() => setMobileMenuOpen(false)}
          className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)]"
        >
          Materials
        </Link>
        <Link
          href="/#temp-retention"
          onClick={() => setMobileMenuOpen(false)}
          className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)]"
        >
          Thermal
        </Link>
        <Link
          href="/#exploded-view"
          onClick={() => setMobileMenuOpen(false)}
          className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)]"
        >
          Design
        </Link>
        <Link
          href="/shop"
          onClick={() => setMobileMenuOpen(false)}
          className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)]"
        >
          Shop
        </Link>
        <Link
          href="/wishlist"
          onClick={() => setMobileMenuOpen(false)}
          className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)]"
        >
          🤍 Saved Items
        </Link>
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            setCartOpen(true);
          }}
          className="text-left text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)] flex items-center justify-between"
        >
          <span>🛍️ Shopping Bag</span>
          {cartItemsCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
              {cartItemsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            toggleTheme();
          }}
          className="text-left text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)] flex items-center justify-between"
        >
          <span>Theme Toggle</span>
          <span>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
        </button>
        {onSearchClick && (
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onSearchClick();
            }}
            className="text-left text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 border-b border-[var(--border-primary)]"
          >
            🔍 Search Catalog
          </button>
        )}
        <Link
          href="/shop"
          onClick={() => setMobileMenuOpen(false)}
          className="mt-2 w-full text-center py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold text-xs uppercase tracking-widest"
        >
          Get Aqua
        </Link>
      </div>
    </nav>
  );
}
