'use client';

import { useEffect, useState } from 'react';
import { Product, ApiResponse } from '@shopsphere/shared-types';
import ScrollFoundation from '../../components/ScrollFoundation';
import Navbar from '../../components/Navbar';
import SearchOverlay from '../../components/SearchOverlay';
import FilterPanel, { FilterState } from '../../components/FilterPanel';
import ProductQuickView from '../../components/ProductQuickView';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCartStore } from '../../store/useCartStore';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  // Search & Filter Panel state
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Cart / Wishlist state mirrors (for notifications)
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Active filters
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceMax: 150,
    capacity: [],
    color: [],
    material: [],
    collection: [],
    retention: [],
    availability: 'all',
  });

  // Pagination page count
  const [itemsLimit, setItemsLimit] = useState(8);

  // Local card colorway variant state mapping: { [productId]: activeColorId }
  const [cardColors, setCardColors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/api/products`);
        if (!res.ok) {
          throw new Error(`Failed to fetch collections: ${res.statusText}`);
        }
        const data: ApiResponse<Product[]> = await res.json();
        if (data.success && data.data) {
          setProducts(data.data);
        } else {
          throw new Error(data.message || 'Failed to retrieve collections');
        }
      } catch (err: unknown) {
        console.error('Error fetching collections:', err);
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const triggerAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter((id) => id !== productId));
      triggerAlert('Removed from wishlist');
    } else {
      setWishlist([...wishlist, productId]);
      triggerAlert('Added to wishlist');
    }
  };

  // Perform Catalog Filtering
  const filteredProducts = products.filter((p) => {
    // 1. Price Max filter
    if (p.price > activeFilters.priceMax) return false;

    // 2. Collection filter
    if (activeFilters.collection.length > 0) {
      const categoryName = p.category?.name || 'Smart Bottles';
      if (!activeFilters.collection.includes(categoryName)) return false;
    }

    // 3. Availability filter
    if (activeFilters.availability === 'instock' && p.stock <= 0) return false;
    if (activeFilters.availability === 'preorder' && p.stock > 0) return false;

    // 4. Color filter
    if (activeFilters.color.length > 0) {
      // If product color options exist or we check variant selections
      const activeColor = cardColors[p.id] || 'default';
      const colorLabel = activeColor === 'default' ? 'Silver' : activeColor === 'blue' ? 'Blue' : activeColor === 'purple' ? 'Purple' : 'Gold';
      if (!activeFilters.color.includes(colorLabel)) return false;
    }

    // 5. Capacity size check (fallback logic)
    if (activeFilters.capacity.length > 0) {
      const capacityMatches = activeFilters.capacity.some(size => 
        p.name.includes(size.split('oz')[0]) || p.description.includes(size.split('oz')[0])
      );
      // If we don't find it in title, default to passing (or filter out if no specs found)
      const hasCapWord = p.name.includes('oz') || p.description.includes('oz');
      if (hasCapWord && !capacityMatches) return false;
    }

    // 6. Material check
    if (activeFilters.material.length > 0) {
      const materialMatches = activeFilters.material.some(m =>
        p.name.toLowerCase().includes(m.toLowerCase().split(' ')[0]) || 
        p.description.toLowerCase().includes(m.toLowerCase().split(' ')[0])
      );
      const hasMatWord = p.description.toLowerCase().includes('steel') || p.description.toLowerCase().includes('copper');
      if (hasMatWord && !materialMatches) return false;
    }

    return true;
  });

  const displayedProducts = filteredProducts.slice(0, itemsLimit);

  // Maximum price in catalog
  const maxPrice = products.reduce((max, p) => (p.price > max ? p.price : max), 150);

  const handleAddToCart = (product: Product, quantity: number, color: string) => {
    addItem(product, quantity, color);
    setCartOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    const activeColor = cardColors[product.id] || 'default';
    const colorLabel = activeColor === 'default' ? 'Silver Matte' : activeColor === 'blue' ? 'Aurora Blue' : activeColor === 'purple' ? 'Velvet Purple' : 'Alpine Gold';
    handleAddToCart(product, 1, colorLabel);
  };

  // Colorway styling helper
  const colorVariants = [
    { id: 'default', color: 'bg-zinc-300', filter: '' },
    { id: 'blue', color: 'bg-indigo-500', filter: 'hue-rotate-[145deg] saturate-125' },
    { id: 'purple', color: 'bg-purple-500', filter: 'hue-rotate-[285deg] saturate-125' },
    { id: 'gold', color: 'bg-amber-500', filter: 'hue-rotate-[35deg] saturate-125' },
  ];

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative">
        
        {/* Luxury Background Glow mesh */}
        <div className="absolute top-[15%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/3 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/4 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Global floating Alert Notification */}
        <AnimatePresence>
          {alertMessage && (
            <motion.div
              initial={{ y: -50, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -50, x: '-50%', opacity: 0 }}
              className="fixed top-24 left-1/2 z-50 px-5 py-3 rounded-full border border-indigo-500/30 bg-zinc-950/80 backdrop-blur text-xs text-white font-bold tracking-wider uppercase shadow-xl flex items-center gap-2"
            >
              <span className="text-indigo-400">✓</span> {alertMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation bar with search triggers */}
        <Navbar onSearchClick={() => setSearchOpen(true)} />

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="max-w-7xl mx-auto px-6 pt-36 pb-24 relative z-20">
          
          {/* Header Layout */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-zinc-900">
            <div>
              <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.25em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Computational Hydration Catalog
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mt-4 font-serif leading-none">
                AQUA SERIES
              </h1>
              <p className="text-zinc-500 text-xs mt-3 max-w-md leading-normal">
                Explore ShopSphere premium custom-tailored double wall vacuum shield templates. Fully customizable colorways and specs.
              </p>
            </div>

            {/* Header Action Tools */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterOpen(true)}
                className="px-5 py-3 rounded-xl border border-zinc-850 hover:border-zinc-750 bg-zinc-900/40 hover:bg-zinc-900/60 text-xs font-bold text-zinc-300 uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <span>🎚️</span> Filters
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="p-3.5 rounded-xl border border-zinc-850 hover:border-zinc-750 bg-zinc-900/40 hover:bg-zinc-900/60 text-xs text-zinc-400 hover:text-white transition-all"
                title="Search Catalog"
              >
                🔍
              </button>
            </div>
          </div>

          {/* Active Filter Tags */}
          <div className="flex flex-wrap gap-2 py-6">
            {activeFilters.collection.map((cat) => (
              <span key={cat} className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-semibold text-indigo-300 uppercase tracking-wider">
                {cat}
              </span>
            ))}
            {activeFilters.capacity.map((size) => (
              <span key={size} className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-semibold text-cyan-300 uppercase tracking-wider">
                {size}
              </span>
            ))}
            {activeFilters.color.map((col) => (
              <span key={col} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-semibold text-purple-300 uppercase tracking-wider">
                {col}
              </span>
            ))}
            {activeFilters.priceMax < maxPrice && (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-semibold text-amber-300 uppercase tracking-wider">
                Max: ${activeFilters.priceMax}
              </span>
            )}
          </div>

          {/* Loading Grid */}
          {loading && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 py-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-zinc-900 bg-zinc-900/10 p-5">
                  <div className="aspect-square w-full rounded-2xl bg-zinc-950" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-zinc-900" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-zinc-950" />
                  <div className="mt-6 flex gap-2">
                    <div className="h-9 flex-1 rounded bg-zinc-900" />
                    <div className="h-9 w-9 rounded bg-zinc-900" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400 py-16">
              <p className="text-sm font-semibold">Failed to load ShopSphere catalog: {error}</p>
            </div>
          )}

          {/* Empty Catalog State */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="text-center py-24 rounded-3xl border border-zinc-900 bg-zinc-900/5">
              <p className="text-sm text-zinc-500">No products match your current filtering matrix.</p>
              <button
                onClick={() => setActiveFilters({
                  priceMax: maxPrice,
                  capacity: [],
                  color: [],
                  material: [],
                  collection: [],
                  retention: [],
                  availability: 'all',
                })}
                className="mt-6 text-xs text-indigo-400 hover:text-white font-bold uppercase tracking-wider underline underline-offset-4"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Catalog Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 py-8">
                {displayedProducts.map((product) => {
                  const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                  
                  // Read current product variant colorway selection state
                  const activeColor = cardColors[product.id] || 'default';
                  const activeFilterClass = activeColor !== 'default'
                    ? colorVariants.find(c => c.id === activeColor)?.filter
                    : '';

                  const isWishlisted = wishlist.includes(product.id);

                  return (
                    <motion.div
                      layout
                      key={product.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950/20 hover:border-zinc-800 hover:bg-zinc-900/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black/45"
                    >
                      {/* Card Visual Head */}
                      <div className="relative aspect-square w-full overflow-hidden bg-zinc-950 flex items-center justify-center p-6">
                        
                        {/* Parallax Image zoom */}
                        <Link href={`/products/${product.id}`} className="absolute inset-0 flex items-center justify-center p-6 z-0">
                          <img
                            src={mainImage}
                            alt={product.name}
                            className={`h-[80%] w-auto object-contain transition-all duration-500 ease-out group-hover:scale-105 ${activeFilterClass}`}
                          />
                        </Link>

                        {/* Top action swatches: Wishlist toggle */}
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full border border-zinc-850 bg-zinc-950/70 backdrop-blur flex items-center justify-center text-xs hover:border-zinc-700 transition-colors focus:outline-none"
                        >
                          {isWishlisted ? '❤️' : '🤍'}
                        </button>

                        {/* Category tag */}
                        <span className="absolute bottom-4 left-4 rounded-lg bg-zinc-950/75 backdrop-blur px-2.5 py-1 text-[9px] font-bold text-indigo-400 border border-zinc-900/60 uppercase tracking-wider">
                          {product.category?.name || 'Insulated'}
                        </span>
                      </div>

                      {/* Card Content details */}
                      <div className="p-5 flex flex-col flex-1 justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <Link href={`/products/${product.id}`} className="block flex-1">
                              <h3 className="text-xs font-semibold text-white tracking-wide uppercase line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                {product.name}
                              </h3>
                            </Link>
                            <span className="text-xs font-black text-white shrink-0">${product.price.toFixed(2)}</span>
                          </div>

                          <p className="mt-2 text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>

                          {/* Horizontal Color Variant Dots */}
                          <div className="flex gap-2 mt-4">
                            {colorVariants.map((col) => (
                              <button
                                key={col.id}
                                onClick={() => setCardColors({ ...cardColors, [product.id]: col.id })}
                                className={`h-4.5 w-4.5 rounded-full border transition-all flex items-center justify-center ${
                                  activeColor === col.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-900 hover:border-zinc-800'
                                }`}
                                title={col.id}
                              >
                                <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Hover reveal Action CTAs */}
                        <div className="mt-5 pt-4 border-t border-zinc-950 flex gap-2">
                          <button
                            onClick={() => setQuickViewProduct(product)}
                            className="flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-xl border border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-colors"
                          >
                            Quick View
                          </button>
                          <button
                            onClick={() => handleQuickAdd(product)}
                            className="h-8.5 px-3.5 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase tracking-widest transition-colors"
                            title="Quick Add To Cart"
                          >
                            + Cart
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>

              {/* Load More Pagination */}
              {filteredProducts.length > itemsLimit && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={() => setItemsLimit(itemsLimit + 4)}
                    className="px-6 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors duration-200"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}

        </main>

        {/* --- DYNAMIC UTILITY MODALS --- */}

        {/* Fullscreen Search suggestion Overlay */}
        <SearchOverlay
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          products={products}
          onSelectProduct={(p) => setQuickViewProduct(p)}
        />

        {/* Side Filter panel drawer */}
        <FilterPanel
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={activeFilters}
          onFilterChange={(f) => setActiveFilters(f)}
          maxCatalogPrice={maxPrice}
        />

        {/* Detailed quick view modal */}
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
        />

        {/* Premium editorial footer */}
        <footer className="bg-zinc-950 border-t border-zinc-900 py-16 text-center text-[10px] text-zinc-500 relative z-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-left mb-12">
            
            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">Catalog</h5>
              <ul className="space-y-2 font-medium">
                <li><button onClick={() => setActiveFilters({ ...activeFilters, collection: ['Smart Bottles'] })} className="hover:text-indigo-400 transition-colors">Smart Series</button></li>
                <li><button onClick={() => setActiveFilters({ ...activeFilters, collection: ['Insulated Bottles'] })} className="hover:text-indigo-400 transition-colors">Insulated Core</button></li>
                <li><button onClick={() => setActiveFilters({ ...activeFilters, collection: ['Limited Edition'] })} className="hover:text-indigo-400 transition-colors">Limited Drop</button></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">Science</h5>
              <ul className="space-y-2 font-medium">
                <li><span className="text-zinc-400">Radiant Shield</span></li>
                <li><span className="text-zinc-400">Vacuum Seal</span></li>
                <li><span className="text-zinc-400">Grit powder coat</span></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">Services</h5>
              <ul className="space-y-2 font-medium">
                <li><span className="text-zinc-400">Track Cargo</span></li>
                <li><span className="text-zinc-400">Warranty Registration</span></li>
                <li><span className="text-zinc-400">Green Logistics</span></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">ShopSphere</h5>
              <p className="text-zinc-500 leading-normal">
                Pinnacle material engineering. Built to hold cold properties for 48 hours.
              </p>
            </div>

          </div>

          <div className="border-t border-zinc-900 pt-8 max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-medium">&copy; 2026 ShopSphere Aqua Inc. All rights reserved.</p>
            <div className="flex gap-6 font-medium">
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <span>&middot;</span>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </footer>

      </div>
    </ScrollFoundation>
  );
}
