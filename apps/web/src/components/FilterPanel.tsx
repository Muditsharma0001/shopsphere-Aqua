'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterState {
  priceMax: number;
  capacity: string[];
  color: string[];
  material: string[];
  collection: string[];
  retention: string[];
  availability: string;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  maxCatalogPrice: number;
}

export default function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  maxCatalogPrice,
}: FilterPanelProps) {
  // Local state mirror for applying
  const [localPrice, setLocalPrice] = useState(filters.priceMax);
  const [localCapacity, setLocalCapacity] = useState<string[]>(filters.capacity);
  const [localColors, setLocalColors] = useState<string[]>(filters.color);
  const [localMaterials, setLocalMaterials] = useState<string[]>(filters.material);
  const [localCollections, setLocalCollections] = useState<string[]>(filters.collection);
  const [localRetention, setLocalRetention] = useState<string[]>(filters.retention);
  const [localAvailability, setLocalAvailability] = useState<string>(filters.availability);

  const toggleArrayItem = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const handleApply = () => {
    onFilterChange({
      priceMax: localPrice,
      capacity: localCapacity,
      color: localColors,
      material: localMaterials,
      collection: localCollections,
      retention: localRetention,
      availability: localAvailability,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalPrice(maxCatalogPrice);
    setLocalCapacity([]);
    setLocalColors([]);
    setLocalMaterials([]);
    setLocalCollections([]);
    setLocalRetention([]);
    setLocalAvailability('all');

    onFilterChange({
      priceMax: maxCatalogPrice,
      capacity: [],
      color: [],
      material: [],
      collection: [],
      retention: [],
      availability: 'all',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Shadow Click Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-45 bg-black"
          />

          {/* Side Drawer Filter Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-48 w-full max-w-sm bg-[#0a0a0c]/90 border-l border-zinc-850 backdrop-blur-2xl shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-900 mb-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Refine Catalog</h3>
                <button onClick={onClose} className="text-zinc-500 hover:text-white text-sm">✕</button>
              </div>

              {/* Filter List */}
              <div className="space-y-6">
                
                {/* 1. Price Max Range */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    <span>Price Threshold</span>
                    <span className="text-indigo-400 font-mono">${localPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxCatalogPrice}
                    value={localPrice}
                    onChange={(e) => setLocalPrice(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-600 font-mono font-medium">
                    <span>$0</span>
                    <span>${maxCatalogPrice}</span>
                  </div>
                </div>

                {/* 2. Collection Category */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Collections</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Smart Bottles', 'Insulated Bottles', 'Sports Bottles', 'Travel Bottles', 'Accessories', 'Limited Edition'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleArrayItem(localCollections, setLocalCollections, cat)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] tracking-wide transition-all ${
                          localCollections.includes(cat)
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Capacity */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Capacity Size</h4>
                  <div className="flex flex-wrap gap-2">
                    {['18oz / 530ml', '24oz / 710ml', '32oz / 950ml'].map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleArrayItem(localCapacity, setLocalCapacity, size)}
                        className={`px-3.5 py-1.5 rounded-xl border text-[10px] tracking-wide transition-all ${
                          localCapacity.includes(size)
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Color Swatches */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Colorway</h4>
                  <div className="flex gap-3">
                    {[
                      { id: 'Silver', color: 'bg-zinc-300' },
                      { id: 'Blue', color: 'bg-indigo-500' },
                      { id: 'Purple', color: 'bg-purple-500' },
                      { id: 'Gold', color: 'bg-amber-500' },
                    ].map((swatch) => (
                      <button
                        key={swatch.id}
                        onClick={() => toggleArrayItem(localColors, setLocalColors, swatch.id)}
                        className={`relative h-10 w-10 rounded-xl transition-all flex items-center justify-center border ${
                          localColors.includes(swatch.id)
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-zinc-850 bg-zinc-950/30'
                        }`}
                        title={swatch.id}
                      >
                        <span className={`h-4.5 w-4.5 rounded-full ${swatch.color}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Materials */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Insulation Shell</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Culinary Steel', 'Insulation Plating'].map((material) => (
                      <button
                        key={material}
                        onClick={() => toggleArrayItem(localMaterials, setLocalMaterials, material)}
                        className={`px-3.5 py-1.5 rounded-xl border text-[10px] tracking-wide transition-all ${
                          localMaterials.includes(material)
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Availability */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Availability</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'instock', label: 'In Stock' },
                      { id: 'preorder', label: 'Pre-Order' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setLocalAvailability(item.id)}
                        className={`py-1.5 rounded-xl border text-[10px] tracking-wide transition-all ${
                          localAvailability === item.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-4 pt-6 border-t border-zinc-900 mt-8">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Apply
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
