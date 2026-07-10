'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@shopsphere/shared-types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Load recent searches
      const stored = localStorage.getItem('shopsphere_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle dynamic search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.brand?.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered.slice(0, 5)); // limit to top 5 results
  }, [query, products]);

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Save recent searches
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('shopsphere_recent_searches', JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('shopsphere_recent_searches');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex justify-center p-6 md:p-24 overflow-y-auto"
        >
          <div className="w-full max-w-2xl flex flex-col gap-8">
            
            {/* Header / Input Form */}
            <div className="flex justify-between items-center gap-4 border-b border-zinc-800 pb-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
                <span className="text-zinc-500 text-lg">🔍</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, materials, insulation..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-white text-base md:text-xl placeholder-zinc-600 focus:outline-none"
                />
              </form>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Results Grid */}
            {query && results.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Search Results</h4>
                <div className="space-y-3">
                  {results.map((product) => {
                    const imgUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                    return (
                      <button
                        key={product.id}
                        onClick={() => {
                          onSelectProduct(product);
                          onClose();
                        }}
                        className="w-full flex gap-4 p-3 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-indigo-500/20 hover:bg-zinc-900/10 text-left transition-all"
                      >
                        <div className="h-12 w-12 rounded-lg bg-zinc-950 overflow-hidden border border-zinc-900 shrink-0">
                          <img src={imgUrl} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <h5 className="text-xs font-semibold text-white">{product.name}</h5>
                          <span className="text-[10px] text-zinc-500 mt-1 block">
                            {product.brand?.name || 'ShopSphere'} &bull; ${product.price.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {query && results.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-zinc-500">No results found matching &quot;{query}&quot;</p>
              </div>
            )}

            {/* Recommendations & Recent Searches */}
            {!query && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Recent Searches */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Recent Searches</h4>
                    {recentSearches.length > 0 && (
                      <button onClick={clearRecent} className="text-[9px] text-zinc-600 hover:text-zinc-400">
                        Clear
                      </button>
                    )}
                  </div>
                  {recentSearches.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSelectRecent(term)}
                          className="w-full text-left py-2 text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          🕒 {term}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-600">No recent searches</p>
                  )}
                </div>

                {/* Trending / Recommended */}
                <div className="space-y-4">
                  <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Trending Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Aqua', 'Smart Bottle', 'Culinary Steel', 'Limited Edition', 'Cap'].map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3.5 py-1.5 rounded-full border border-zinc-850 bg-zinc-900/10 hover:border-zinc-700 hover:bg-zinc-900/30 text-[10px] text-zinc-400 hover:text-white transition-all"
                      >
                        ⚡ {term}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
