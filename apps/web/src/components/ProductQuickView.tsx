'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@shopsphere/shared-types';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color: string) => void;
}

export default function ProductQuickView({
  product,
  onClose,
  onAddToCart,
}: ProductQuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('default');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images.map(img => img.url)
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];

  const colorVariants = [
    { id: 'default', label: 'Silver Matte', border: 'border-zinc-300', bg: 'bg-zinc-300', filter: '' },
    { id: 'blue', label: 'Aurora Blue', border: 'border-indigo-500', bg: 'bg-indigo-500', filter: 'hue-rotate-[145deg] saturate-125' },
    { id: 'purple', label: 'Velvet Purple', border: 'border-purple-500', bg: 'bg-purple-500', filter: 'hue-rotate-[285deg] saturate-125' },
    { id: 'gold', label: 'Alpine Gold', border: 'border-amber-500', bg: 'bg-amber-500', filter: 'hue-rotate-[35deg] saturate-125' },
  ];

  const handleAddToCart = () => {
    const activeColorLabel = colorVariants.find(c => c.id === selectedColor)?.label || 'Silver Matte';
    onAddToCart(product, quantity, activeColorLabel);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-10 overflow-y-auto"
      >
        {/* Click backdrop to close */}
        <div className="absolute inset-0 z-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative z-10 w-full max-w-4xl bg-[#09090b]/90 border border-zinc-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-12 max-h-[90vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 h-8 w-8 rounded-full border border-zinc-800 bg-zinc-950/70 backdrop-blur flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors focus:outline-none"
          >
            ✕
          </button>

          {/* Left: Images visualizer (Col-span 7) */}
          <div className="col-span-12 md:col-span-6 bg-zinc-950 flex flex-col justify-between p-6 md:p-8 border-b md:border-b-0 md:border-r border-zinc-900 min-h-[300px] md:min-h-[450px]">
            <div className="flex-1 flex items-center justify-center overflow-hidden max-h-[320px]">
              <img
                src={images[activeImageIndex]}
                alt={product.name}
                className={`h-64 w-auto object-contain transition-all duration-500 ease-out ${
                  selectedColor !== 'default' ? colorVariants.find(c => c.id === selectedColor)?.filter : ''
                }`}
              />
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`h-10 w-10 rounded-lg border overflow-hidden transition-all ${
                      activeImageIndex === i ? 'border-indigo-500' : 'border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <img src={img} alt="product thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details (Col-span 5) */}
          <div className="col-span-12 md:col-span-6 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                {product.category?.name || 'Hydration Core'}
              </span>
              <h2 className="text-xl md:text-3xl font-black text-white mt-4 tracking-tight leading-tight">
                {product.name}
              </h2>
              <span className="text-lg font-bold text-white mt-2 block">${product.price.toFixed(2)}</span>

              <p className="text-zinc-400 text-xs mt-4 leading-relaxed">
                {product.description}
              </p>

              {/* Color variant swatch picker */}
              <div className="mt-6 space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Select Shield Variant</span>
                <div className="flex gap-2">
                  {colorVariants.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedColor(item.id)}
                      className={`relative h-10 w-10 rounded-xl transition-all flex items-center justify-center border ${
                        selectedColor === item.id 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950/40'
                      }`}
                      title={item.label}
                    >
                      <span className={`h-4.5 w-4.5 rounded-full ${item.bg} shadow-inner`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="mt-6 flex items-center gap-4">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Quantity</span>
                <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-900 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions CTA buttons */}
            <div className="flex gap-3 mt-8 pt-4 border-t border-zinc-900">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-750 text-xs font-bold text-zinc-300 uppercase tracking-widest transition-all"
              >
                Add To Cart
              </button>
              <button
                onClick={() => {
                  handleAddToCart();
                  // Trigger buy now path
                }}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Buy Now
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
