'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Product, ApiResponse } from '@shopsphere/shared-types';
import ScrollFoundation from '../../../components/ScrollFoundation';
import Navbar from '../../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useCartStore } from '../../../store/useCartStore';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  // Gallery & Purchase settings
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('default');
  const [quantity, setQuantity] = useState(1);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // UI status alerts
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Timeline & Buy Box refs
  const buyBoxRef = useRef<HTMLDivElement>(null);
  const specsSectionRef = useRef<HTMLDivElement>(null);
  const scrollTimelineRef = useRef<HTMLDivElement>(null);

  // Fetch catalog item by ID
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/api/products`);
        if (!res.ok) {
          throw new Error(`Failed to load product details: ${res.statusText}`);
        }
        const data: ApiResponse<Product[]> = await res.json();
        if (data.success && data.data) {
          // Find target item
          const matched = data.data.find((p) => p.id === id);
          if (matched) {
            setProduct(matched);
            // set related products from same category
            const related = data.data.filter((p) => p.id !== matched.id).slice(0, 4);
            setRelatedProducts(related);
          } else {
            // Mock fallback to allow demo load if requested ID is not in DB
            const mockProduct: Product = {
              id: id as string,
              name: 'ShopSphere Aqua Pro',
              description: 'Our flagship smart thermal container. Implemented with copper-plated double walls to hold hot properties for 24 hours and cold for 48 hours. Tactile matte zero-sweat finish.',
              price: 89.99,
              stock: 25,
              images: [{ id: '1', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800', isFeatured: true, productId: id as string, createdAt: new Date() }],
              compareAtPrice: 109.99,
              categoryId: 'smart-series',
              brandId: 'shopsphere',
              createdAt: new Date(),
              updatedAt: new Date(),
              slug: 'shopsphere-aqua-pro',
              category: { id: 'smart-series', name: 'Smart Bottles', createdAt: new Date(), updatedAt: new Date(), slug: 'smart-series' },
              brand: { id: 'shopsphere', name: 'ShopSphere', createdAt: new Date(), updatedAt: new Date(), slug: 'shopsphere' }
            };
            setProduct(mockProduct);
            setRelatedProducts(data.data.slice(0, 4));
          }
        }
      } catch (err: unknown) {
        console.error('Error fetching details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [id]);

  // Exploded Keynote scrolling timeline trigger
  useEffect(() => {
    if (loading || !product || !scrollTimelineRef.current) return;

    const timelineContainer = scrollTimelineRef.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: timelineContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        pin: '.pin-visual-wrapper',
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Animate panels fading sequentially
    tl.to('.keynote-text-1', { opacity: 0, y: -30, duration: 1 })
      .fromTo('.keynote-text-2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 })
      .to('.keynote-text-2', { opacity: 0, y: -30, duration: 1, delay: 0.5 })
      .fromTo('.keynote-text-3', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 })
      .to('.keynote-text-3', { opacity: 0, y: -30, duration: 1, delay: 0.5 })
      .fromTo('.keynote-text-4', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [loading, product]);

  const triggerAlert = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleAddToCart = (product: Product, qty: number, colorLabel: string) => {
    addItem(product, qty, colorLabel);
    setCartOpen(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const colorVariants = [
    { id: 'default', label: 'Silver Matte', color: 'bg-zinc-300', filter: '' },
    { id: 'blue', label: 'Aurora Blue', color: 'bg-indigo-500', filter: 'hue-rotate-[145deg] saturate-125' },
    { id: 'purple', color: 'bg-purple-500', label: 'Velvet Purple', filter: 'hue-rotate-[285deg] saturate-125' },
    { id: 'gold', color: 'bg-amber-500', label: 'Alpine Gold', filter: 'hue-rotate-[35deg] saturate-125' },
  ];

  const activeFilter = selectedColor !== 'default'
    ? colorVariants.find(c => c.id === selectedColor)?.filter
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 animate-pulse">
          <span className="text-2xl font-black text-white">S</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#030304] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-xl font-bold text-red-400">Failed to load product details</h2>
        <p className="text-xs text-zinc-500 mt-2">{error || 'Product not found'}</p>
        <Link href="/shop" className="mt-8 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-wider text-white">
          Back to Shop
        </Link>
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0
    ? product.images.map(img => img.url)
    : ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800'];

  const specs = [
    { label: 'Capacity', value: '24oz / 710ml', icon: '🥛' },
    { label: 'Weight', value: '380g (empty)', icon: '⚖️' },
    { label: 'Insulation', value: 'Copper Vacuum', icon: '🛡️' },
    { label: 'Thermal Lock', value: '48h Cold / 24h Hot', icon: '❄️' },
    { label: 'Material', value: '18/8 Stainless Steel', icon: '💎' },
    { label: 'Cap Lid', value: 'Magnetic Spout Lock', icon: '🔒' },
    { label: 'Dishwasher Safe', value: 'Lid only (Body handwash)', icon: '🧼' },
    { label: 'Warranty', value: 'Lifetime Guarantee', icon: '🌱' },
  ];

  return (
    <ScrollFoundation>
      <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans antialiased overflow-x-hidden relative select-none">
        
        {/* Ambient mesh glow backdrops */}
        <div className="absolute top-[10%] left-[10%] w-[35vw] h-[35vw] bg-indigo-500/3 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[30%] right-[10%] w-[40vw] h-[40vw] bg-purple-500/4 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Global Alert */}
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

        <Navbar />

        {/* --- MAIN HERO PRODUCT SUMMARY BLOCK --- */}
        <section className="max-w-7xl mx-auto px-6 pt-36 pb-20 relative z-20">
          
          {/* Breadcrumb path */}
          <div className="flex gap-2 text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-8 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-indigo-400 font-bold">{product.category?.name || 'Insulated'}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Product Interactive Image Gallery (Col-span 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Main zoomable frame */}
              <div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setFullscreenImage(galleryImages[activeImgIndex])}
                className="relative aspect-square w-full rounded-3xl border border-zinc-900 bg-zinc-950/80 flex items-center justify-center p-8 overflow-hidden cursor-zoom-in"
              >
                {/* Background light rays */}
                <div className="absolute inset-0 bg-radial-gradient opacity-15" />

                <img
                  src={galleryImages[activeImgIndex]}
                  alt={product.name}
                  className={`h-[80%] w-auto object-contain transition-transform duration-200 ease-out select-none ${activeFilter}`}
                  style={
                    isHovered
                      ? {
                          transform: 'scale(1.5)',
                          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                        }
                      : undefined
                  }
                />

                <div className="absolute bottom-4 right-4 bg-zinc-950/60 border border-zinc-900 backdrop-blur rounded-full px-3 py-1 text-[9px] font-mono text-zinc-500 uppercase tracking-widest pointer-events-none">
                  Hover to Magnify / Click to Expand
                </div>
              </div>

              {/* Thumbnails list */}
              {galleryImages.length > 1 && (
                <div className="flex justify-center gap-3">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImgIndex(i)}
                      className={`h-16 w-16 rounded-xl border overflow-hidden transition-all bg-zinc-950 ${
                        activeImgIndex === i ? 'border-indigo-500 scale-102 shadow-lg shadow-indigo-500/10' : 'border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <img src={img} alt="Thumbnail view" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Buying parameters box (Col-span 5) */}
            <div ref={buyBoxRef} className="lg:col-span-5 space-y-6">
              
              <div className="space-y-4">
                <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  {product.brand?.name || 'ShopSphere Core'}
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mt-2">
                  {product.name}
                </h1>
                
                {/* Price & Rating */}
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-2xl font-black text-white">${product.price.toFixed(2)}</span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-zinc-500 line-through font-semibold">${product.compareAtPrice.toFixed(2)}</span>
                  )}
                  <div className="h-4 w-[1px] bg-zinc-800" />
                  <span className="text-xs text-amber-500 font-bold">★★★★★ <span className="text-zinc-400 font-mono font-medium ml-1">5.0 (4,800 reviews)</span></span>
                </div>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed border-b border-zinc-900 pb-6">
                {product.description}
              </p>

              {/* Swatch variant color selector */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                  <span>Selected Shield Colorway</span>
                  <span className="text-indigo-400 font-bold font-mono">
                    {colorVariants.find((c) => c.id === selectedColor)?.label}
                  </span>
                </div>
                <div className="flex gap-2">
                  {colorVariants.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedColor(item.id)}
                      className={`relative h-11 w-11 rounded-xl transition-all flex items-center justify-center border ${
                        selectedColor === item.id 
                          ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow shadow-indigo-500/10' 
                          : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950/40'
                      }`}
                      title={item.label}
                    >
                      <span className={`h-5 w-5 rounded-full ${item.color} shadow-inner`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity setting */}
              <div className="flex items-center gap-4 border-t border-zinc-900 pt-6">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Volume Count</span>
                <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-900 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buying triggers */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => handleAddToCart(product, quantity, colorVariants.find(c => c.id === selectedColor)?.label || 'Silver Matte')}
                  className="flex-1 py-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-750 text-xs font-bold text-zinc-300 uppercase tracking-widest transition-all"
                >
                  Add To Cart
                </button>
                <button
                  onClick={() => triggerAlert('Order processed! Redirecting to checkout...')}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Buy Now
                </button>
              </div>

              {/* Assurances list */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-900 text-center">
                <div className="space-y-1">
                  <span className="block text-lg">🚚</span>
                  <span className="block text-[8px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Carbon Safe Ship</span>
                </div>
                <div className="space-y-1 border-x border-zinc-900 px-2">
                  <span className="block text-lg">🛡️</span>
                  <span className="block text-[8px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Lifetime Guarantee</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-lg">🔄</span>
                  <span className="block text-[8px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">30 Days Returns</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* --- APPLE KEYNOTE SCROLLING FEATURES TIMELINE --- */}
        <section ref={scrollTimelineRef} className="relative h-[280vh] border-t border-zinc-900/60 bg-[#060608]/50 z-20">
          
          {/* Sticky container */}
          <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
            
            <div className="max-w-7xl w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full relative">
              
              {/* Left Column: Pinned visual wrapper */}
              <div className="lg:col-span-6 flex justify-center items-center h-full pin-visual-wrapper">
                <div className="relative aspect-square w-80 max-w-full flex items-center justify-center rounded-3xl bg-zinc-950/40 border border-zinc-900/80 p-8 shadow-2xl">
                  <div className="absolute inset-0 bg-radial-gradient opacity-10" />
                  <img
                    src={galleryImages[0]}
                    alt="Keynote presentation product"
                    className={`h-[90%] w-auto object-contain transition-all duration-300 ${activeFilter}`}
                  />
                </div>
              </div>

              {/* Right Column: Fading specs cards */}
              <div className="lg:col-span-6 h-full flex flex-col justify-center items-start relative overflow-hidden text-left pl-6 md:pl-16">
                
                {/* Feature 1 */}
                <div className="keynote-text-1 absolute inset-x-6 flex flex-col justify-center items-start text-left space-y-4">
                  <span className="text-indigo-400 text-xs font-mono font-bold uppercase tracking-widest">Core Feature 01</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    Double-Wall Vacuum Insulation.
                  </h2>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md">
                    Eliminates all air particles between the inner and outer stainless steel shells, blocking convection currents and preserving cold properties for 48 hours.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="keynote-text-2 absolute inset-x-6 flex flex-col justify-center items-start text-left space-y-4 opacity-0">
                  <span className="text-purple-400 text-xs font-mono font-bold uppercase tracking-widest">Core Feature 02</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    Medical Stainless Structure.
                  </h2>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md">
                    Crafted strictly with medical-grade 18/8 Culinary Stainless Steel. Pure taste. Zero metallic taste transfer. Extremely rugged structure.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="keynote-text-3 absolute inset-x-6 flex flex-col justify-center items-start text-left space-y-4 opacity-0">
                  <span className="text-pink-400 text-xs font-mono font-bold uppercase tracking-widest">Core Feature 03</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    Magnetic Lock Cap Spout.
                  </h2>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md">
                    Spout lid locks magnetically onto the top hinge, staying cleanly away from your eyes during hydrate loops. Completely leak-proof.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="keynote-text-4 absolute inset-x-6 flex flex-col justify-center items-start text-left space-y-4 opacity-0">
                  <span className="text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">Core Feature 04</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    Eco Carbon Shield.
                  </h2>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-md">
                    Replacing single-use plastic units. One ShopSphere Aqua bottle offsets over 15,000 plastic bottles, lowering carbon footprint levels.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* --- SPECIFICATIONS MATRIX SECTION --- */}
        <section ref={specsSectionRef} className="relative py-28 md:py-36 border-t border-zinc-900/60 max-w-7xl mx-auto px-6 z-20">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
              AQUA Metrics
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              SPECIFICATION ARCHITECTURE
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm">
              Explore the detailed technical metrics of the ShopSphere Aqua container.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {specs.map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 text-center hover:border-indigo-500/20 transition-all duration-300 shadow-md"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <span className="block text-[8px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">{item.label}</span>
                <span className="block text-xs font-bold text-white mt-1.5">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* --- DETAILED CUSTOMER REVIEWS BLOCK --- */}
        <section className="relative py-28 border-t border-zinc-900/60 bg-[#060608]/40 z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Verified Feedback</span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">WHAT CUSTOMERS FEEL</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
              
              {/* Left Column: Review Statistics Summary */}
              <div className="md:col-span-4 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur text-center space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Catalog Score</h4>
                <div className="text-5xl font-black text-white font-mono">4.9<span className="text-xs text-zinc-500">/ 5.0</span></div>
                <div className="text-amber-500 text-xs">★★★★★</div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Calculated from 15,000+ verified customer ratings.
                </p>

                {/* Rating distribution progress bars */}
                <div className="space-y-2 pt-4 border-t border-zinc-900 text-left">
                  {[
                    { stars: 5, pct: '92%' },
                    { stars: 4, pct: '6%' },
                    { stars: 3, pct: '1%' },
                    { stars: 2, pct: '0%' },
                    { stars: 1, pct: '1%' },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center justify-between gap-3 text-[9px] font-mono text-zinc-500">
                      <span className="w-12">{row.stars} stars</span>
                      <div className="flex-1 h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/80" style={{ width: row.pct }} />
                      </div>
                      <span className="w-8 text-right">{row.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Reviews Grid */}
              <div className="md:col-span-8 space-y-4">
                {[
                  { name: 'Kaelen V.', role: 'Backcountry Hiker', date: 'Jul 2026', comment: 'Absolutely bombproof. Kept my ice frozen for 2 whole days in Yosemite heat. The matte outer coat has a fantastic non-slip feel.', rating: 5, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
                  { name: 'Elena R.', role: 'UX Consultant', date: 'Jun 2026', comment: 'Sleek geometric lines. Fits beautifully on my workspace desk. The magnetic hinge cap is an absolute lifesaver.', rating: 5, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
                  { name: 'Derrick M.', role: 'Triathlete', date: 'May 2026', comment: 'Double seal cap lid is 100% leak proof. Tossed it in my sports pack, zero drips. Great product.', rating: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
                ].map((rev, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/30 flex gap-4 items-start">
                    <img src={rev.avatar} alt={rev.name} className="h-9 w-9 rounded-full object-cover shrink-0 border border-zinc-850" />
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-bold text-white">{rev.name}</h5>
                        <span className="text-[8px] font-mono text-zinc-500">{rev.date}</span>
                      </div>
                      <div className="text-amber-500 text-[9px]">★★★★★</div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed pt-1">
                        &quot;{rev.comment}&quot;
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* --- RELATED PRODUCTS CAROUSEL --- */}
        <section className="relative py-28 border-t border-zinc-900/60 max-w-7xl mx-auto px-6 z-20">
          <div className="mb-14">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Complete the Setup</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-1">RELATED SPECIMENS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => {
              const imgUrl = p.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/20 hover:border-zinc-850 hover:bg-zinc-900/10 transition-all duration-300"
                >
                  <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center p-4">
                    <img src={imgUrl} alt={p.name} className="h-[75%] w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute bottom-3 left-3 bg-zinc-950/70 border border-zinc-900 px-2 py-0.5 rounded text-[8px] text-indigo-400 uppercase font-bold">
                      {p.category?.name || 'Insulated'}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-[11px] font-semibold text-white tracking-wide uppercase line-clamp-1 group-hover:text-indigo-400 transition-colors">
                          {p.name}
                        </h4>
                        <span className="text-[11px] font-black text-white">${p.price.toFixed(2)}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 line-clamp-2 leading-relaxed mt-2">{p.description}</p>
                    </div>

                    <Link
                      href={`/products/${p.id}`}
                      className="mt-4 w-full py-2.5 text-center text-[9px] font-bold uppercase tracking-widest rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white transition-colors"
                    >
                      View Specs
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- STICKY MOBILE BOTTOM CTA PANEL --- */}
        <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-zinc-850 bg-zinc-950/80 backdrop-blur p-4">
          <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
            <div>
              <span className="block text-[8px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Active Selection</span>
              <span className="block text-xs font-bold text-white line-clamp-1 mt-0.5">{product.name}</span>
            </div>
            <button
              onClick={() => triggerAlert('Added selection to cart!')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-[10px] uppercase tracking-widest shadow shadow-indigo-500/10"
            >
              Get Aqua
            </button>
          </div>
        </div>

        {/* --- FULLSCREEN IMAGE PREVIEW OVERLAY --- */}
        <AnimatePresence>
          {fullscreenImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenImage(null)}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 cursor-zoom-out"
            >
              <img
                src={fullscreenImage}
                alt="Fullscreen product visual model"
                className={`max-h-[90vh] max-w-[90vw] object-contain transition-all duration-300 ${activeFilter}`}
              />
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white text-lg focus:outline-none"
              >
                ✕ Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="bg-zinc-950 border-t border-zinc-900 py-16 text-center text-[10px] text-zinc-500 relative z-20 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-left mb-12">
            
            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">Categories</h5>
              <ul className="space-y-2 font-medium">
                <li><Link href="/shop" className="hover:text-indigo-400 transition-colors">Insulated Bottles</Link></li>
                <li><Link href="/shop" className="hover:text-indigo-400 transition-colors">Smart Bottles</Link></li>
                <li><Link href="/shop" className="hover:text-indigo-400 transition-colors">Limited Drop</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">Engineering</h5>
              <ul className="space-y-2 font-medium">
                <li><span className="text-zinc-400">Copper core lock</span></li>
                <li><span className="text-zinc-400">Hinge spout magnet</span></li>
                <li><span className="text-zinc-400">Matte powder shield</span></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">Assurance</h5>
              <ul className="space-y-2 font-medium">
                <li><span className="text-zinc-400">Carbon offsetting cargo</span></li>
                <li><span className="text-zinc-400">Warranty registration</span></li>
                <li><span className="text-zinc-400">30 days returns guarantee</span></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider text-xs">ShopSphere</h5>
              <p className="text-zinc-500 leading-normal max-w-[200px]">
                Built to resist heat convection scales, delivering pure cold hydration for 48 hours.
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
