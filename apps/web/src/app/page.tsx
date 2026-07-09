'use client';

import { useEffect, useState, useRef } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { Product, ApiResponse, User } from '@shopsphere/shared-types';
import Link from 'next/link';
import Lenis from 'lenis';
import ImageSequenceCanvas from '../components/ImageSequenceCanvas';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Scroll Animation State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<'default' | 'blue' | 'purple' | 'gold'>('default');

  // useScroll hook targeting the scroll container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Track progress updates
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setScrollProgress(latest);
  });

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Fetch authentication status and products
  useEffect(() => {
    const fetchProfile = async (retry = true) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' });
        
        if (res.status === 401 && retry) {
          const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (refreshRes.ok) {
            await fetchProfile(false);
          } else {
            setUser(null);
          }
        } else if (res.ok) {
          const data: ApiResponse<User> = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setUser(null);
      }
    };

    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/api/products`);
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.statusText}`);
        }
        const data: ApiResponse<Product[]> = await res.json();
        if (data.success && data.data) {
          setProducts(data.data);
        } else {
          throw new Error(data.message || 'Failed to retrieve products');
        }
      } catch (err: unknown) {
        console.error('Error fetching products:', err);
        const errMsg = err instanceof Error ? err.message : 'An error occurred.';
        setErrorProducts(errMsg);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProfile();
    fetchProducts();
  }, []);

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  // Determine dynamic frame sequence values
  let activeScale = 1.0;
  let activeXOffset = 0;
  let activeColor = selectedColor;

  if (scrollProgress < 0.15) {
    activeScale = 0.85;
  } else if (scrollProgress < 0.35) {
    const ratio = (scrollProgress - 0.15) / 0.20;
    activeScale = 0.85 + ratio * 0.25;
  } else if (scrollProgress < 0.55) {
    activeScale = 1.10;
  } else if (scrollProgress < 0.75) {
    const ratio = (scrollProgress - 0.55) / 0.20;
    activeScale = 1.10;
    activeXOffset = ratio * 22;
  } else if (scrollProgress < 0.90) {
    const ratio = (scrollProgress - 0.75) / 0.15;
    activeScale = 1.10;
    activeXOffset = 22;
    if (selectedColor === 'default') {
      if (ratio > 0.25 && ratio < 0.50) activeColor = 'blue';
      else if (ratio >= 0.50 && ratio < 0.75) activeColor = 'purple';
      else if (ratio >= 0.75) activeColor = 'gold';
    }
  } else {
    const ratio = (scrollProgress - 0.90) / 0.10;
    activeScale = 1.10 + ratio * 0.30;
    activeXOffset = (1 - ratio) * 22;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* Preloader Overlay */}
      {!imagesLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25">
            <span className="text-3xl font-bold text-white animate-pulse">S</span>
          </div>
          <h2 className="mt-8 text-lg font-semibold tracking-tight text-white">
            Preloading Assets
          </h2>
          <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${preloadProgress}%` }}
            />
          </div>
          <span className="mt-2 text-xs font-mono text-zinc-500">{preloadProgress}% Loaded</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                ShopSphere
              </span>
              <span className="ml-2 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                AQUA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Preloaded {preloadProgress}%
            </div>

            {/* Authentication States */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-sm font-semibold text-indigo-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-medium text-zinc-300">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 transition-all duration-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Scroll Container */}
      <div ref={containerRef} className="relative h-[650vh] bg-zinc-950">
        
        {/* Sticky Canvas & Spotlight */}
        <div className="sticky top-16 h-[calc(100vh-64px)] w-full overflow-hidden flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_60%)]" />
          <div className="w-full h-full max-w-7xl flex items-center justify-center">
            <ImageSequenceCanvas
              folderPath="/bottle"
              fileNamePrefix="ezgif-frame-"
              frameCount={51}
              progress={scrollProgress}
              selectedColor={activeColor}
              xOffsetPercent={activeXOffset}
              scaleFactor={activeScale}
              onLoadProgress={(p) => setPreloadProgress(p)}
              onLoadComplete={() => setImagesLoaded(true)}
            />
          </div>
        </div>

        {/* Scroll Sections */}
        
        {/* Slide 0 - Hero */}
        <div className="relative z-10 h-screen flex flex-col justify-between items-center text-center px-6 py-20 pointer-events-none">
          <div className="mt-8">
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent sm:text-7xl">
              Hydrate Smarter.<br />Live Better.
            </h1>
            <p className="mt-4 text-base text-zinc-400 max-w-md mx-auto">
              Introducing ShopSphere Aqua. Pro-grade thermal insulation met by design interfaces mapped for daily performance.
            </p>
          </div>
          <div className="mb-8 flex items-center gap-2 text-xs font-semibold text-zinc-500 animate-bounce">
            <span>Scroll to Explore</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Slide 1 - Future of Hydration */}
        <div className="relative z-10 h-screen flex items-center justify-center px-6 pointer-events-none">
          <div className="text-center max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent sm:text-5xl">
              The Future of Hydration
            </h2>
            <p className="mt-4 text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
              A cinematic reveal of pure engineering. Double-walled structure crafted to hold cold freshness for hours without thermal leakage.
            </p>
          </div>
        </div>

        {/* Slide 2 - Features Cards */}
        <div className="relative z-10 h-[120vh] flex flex-col justify-center px-8 sm:px-16 pointer-events-none">
          <div className="max-w-4xl mx-auto w-full">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-10 text-center sm:text-left">
              Engineered to Excel
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Vacuum Insulated', desc: 'Double-walled premium copper insulation keeping cold for 24 hours.' },
                { title: 'BPA Free', desc: '100% non-toxic food-grade internals protecting wellness.' },
                { title: 'Leak Proof', desc: 'Secure compression seal prevent drops and spillages.' },
                { title: 'Stainless Steel', desc: 'Built with pro-grade 18/8 culinary stainless core.' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md p-6 shadow-xl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                    {i + 1}
                  </div>
                  <h3 className="text-base font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide 3 - Specifications */}
        <div className="relative z-10 h-screen flex items-center justify-start px-8 sm:px-24 pointer-events-none">
          <div className="max-w-md w-full">
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Form Follows Perfection.
            </h2>
            <p className="mt-4 text-zinc-400 text-sm leading-relaxed">
              Every detail optimized. From structural steel selection to the grip coefficient of the outer finish.
            </p>
            <div className="mt-8 border-t border-zinc-900 pt-6 space-y-4 text-sm">
              {[
                { label: 'Capacity', value: '24oz / 710ml' },
                { label: 'Thermal Retention', value: '24 Hrs Cold / 12 Hrs Hot' },
                { label: 'Material', value: '18/8 Culinary Grade Steel' },
                { label: 'Outer Coating', value: 'Grip-matte powder coat' },
              ].map((spec, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-zinc-900">
                  <span className="text-zinc-500">{spec.label}</span>
                  <span className="font-semibold text-zinc-200">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide 4 - Color Variants */}
        <div className="relative z-10 h-screen flex items-center justify-start px-8 sm:px-24">
          <div className="max-w-md w-full">
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Choose Your Aura.
            </h2>
            <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
              Express your aesthetic with dynamic mineral colors. Click to swap variants.
            </p>
            <div className="mt-8 flex gap-4">
              {[
                { id: 'default', label: 'Silver Matte', color: 'bg-zinc-400' },
                { id: 'blue', label: 'Aurora Blue', color: 'bg-blue-500' },
                { id: 'purple', label: 'Velvet Purple', color: 'bg-purple-500' },
                { id: 'gold', label: 'Alpine Gold', color: 'bg-amber-500' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedColor(item.id as 'default' | 'blue' | 'purple' | 'gold')}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    selectedColor === item.id ? 'border-white scale-110 shadow-lg shadow-indigo-500/20' : 'border-zinc-800'
                  }`}
                  title={item.label}
                >
                  <span className={`h-6 w-6 rounded-full ${item.color}`} />
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Variant: {selectedColor}
            </div>
          </div>
        </div>

        {/* Slide 5 - Call to Action */}
        <div className="relative z-10 h-screen flex flex-col justify-center items-center text-center px-6">
          <div>
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              Elevate Your Hydration.
            </h2>
            <p className="mt-4 text-base text-zinc-400 max-w-md mx-auto">
              Own the pinnacle of daily thermal design. Complete your setup today.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={() => {
                  const el = document.getElementById('collection');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                Shop Collection
              </button>
              <button 
                onClick={() => setSelectedColor('default')}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-3.5 text-sm font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                Reset Variant
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Featured Products Grid */}
      <section id="collection" className="relative z-10 bg-zinc-950 border-t border-zinc-900 py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
              Exclusive Gear
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Featured ShopSphere Collections
            </h2>
            <p className="mt-2 text-sm text-zinc-500 max-w-xl">
              Browse relationally consistent data populated straight from your Neon database instance.
            </p>
          </div>

          {/* Loading Collection */}
          {loadingProducts && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-zinc-900 bg-zinc-900/50 p-4">
                  <div className="aspect-square w-full rounded-xl bg-zinc-800" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-zinc-800" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-zinc-850" />
                  <div className="mt-6 flex justify-between">
                    <div className="h-5 w-16 rounded bg-zinc-800" />
                    <div className="h-4 w-10 rounded bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Collection */}
          {errorProducts && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
              <p className="text-sm font-semibold">Failed to load collections: {errorProducts}</p>
            </div>
          )}

          {/* Render Collections */}
          {!loadingProducts && !errorProducts && products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/20 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-850 hover:bg-zinc-900/40 hover:shadow-xl"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 rounded-lg bg-zinc-950/70 backdrop-blur-md px-2 py-1 text-[10px] font-semibold text-indigo-400 border border-zinc-900">
                        {product.brand?.name || 'Generic'}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 p-5">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                      <h3 className="mt-1.5 text-sm font-semibold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="mt-5 flex items-baseline justify-between pt-4 border-t border-zinc-900">
                        <span className="text-base font-bold text-white">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {product.stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-center text-xs text-zinc-500">
        <p>&copy; 2026 ShopSphere Aqua Inc. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4 text-zinc-400">
          <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
          <span>&middot;</span>
          <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
