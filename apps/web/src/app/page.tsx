'use client';

import { useEffect, useState } from 'react';
import { Product, ApiResponse } from '@shopsphere/shared-types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        console.log('Fetching products from:', `${apiUrl}/api/products`);
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
        const errMsg = err instanceof Error ? err.message : 'An error occurred while fetching products.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
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
                v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Neon DB Connected
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent sm:text-4xl">
              Milestone 1 — Verification Page
            </h1>
            <p className="mt-2 text-zinc-400">
              Verifying frontend connection to Neon PostgreSQL via Express backend API.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto text-sm text-zinc-500 bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-800">
            <span>Total Seeded Products:</span>
            <span className="font-semibold text-zinc-200">{loading ? '...' : products.length}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="aspect-square w-full rounded-xl bg-zinc-800" />
                <div className="mt-4 h-4 w-2/3 rounded bg-zinc-800" />
                <div className="mt-2 h-3 w-1/3 rounded bg-zinc-800" />
                <div className="mt-6 flex items-center justify-between">
                  <div className="h-5 w-16 rounded bg-zinc-800" />
                  <div className="h-4 w-12 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            <h2 className="text-lg font-semibold">Database Connection Error</h2>
            <p className="mt-2 text-sm text-red-400/80">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
            <p className="text-lg">No products found in the database.</p>
            <p className="mt-1 text-sm text-zinc-600">Please make sure you have run the prisma seed script.</p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900/60 hover:shadow-xl hover:shadow-indigo-500/5"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      <span className="rounded-lg bg-zinc-950/70 backdrop-blur-md px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-indigo-400 border border-zinc-800">
                        {product.brand?.name || 'Generic'}
                      </span>
                    </div>
                  </div>

                  {/* Info Container */}
                  <div className="flex flex-col flex-1 p-5">
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                    <h3 className="mt-1.5 text-base font-semibold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-6 flex items-baseline justify-between pt-4 border-t border-zinc-800/60">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-white">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-zinc-500 line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        product.stock > 50 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
