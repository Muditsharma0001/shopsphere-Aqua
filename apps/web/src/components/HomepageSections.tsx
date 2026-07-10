'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

import { Product } from '@shopsphere/shared-types';

interface HomepageSectionsProps {
  products: Product[];
  loadingProducts: boolean;
  errorProducts: string | null;
}

interface Review {
  id: number;
  name: string;
  role: string;
  rating: number;
  comment: string;
  avatar: string;
}

export default function HomepageSections({
  products,
  loadingProducts,
  errorProducts,
}: HomepageSectionsProps) {
  // Refs for animations
  const materialsRef = useRef<HTMLDivElement>(null);
  const tempRef = useRef<HTMLDivElement>(null);
  const explodedRef = useRef<HTMLDivElement>(null);
  const hydrationCanvasRef = useRef<HTMLCanvasElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  
  // Stats counters state
  const [stats, setStats] = useState({
    countries: 0,
    customers: 0,
    leakProof: 0,
    retention: 0,
  });

  // Color Swapper state
  const [activeColor, setActiveColor] = useState<'default' | 'blue' | 'purple' | 'gold'>('default');

  // Interactive temperature timeline active tab
  const [tempMode, setTempMode] = useState<'cold' | 'hot'>('cold');

  // FAQ Active State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Trigger stats counter animation with GSAP ScrollTrigger
  useEffect(() => {
    const el = statsSectionRef.current;
    if (!el) return;

    const statsObj = { countries: 0, customers: 0, leakProof: 0, retention: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(statsObj, {
          countries: 50,
          customers: 100, // representing 1M+ using scaled counter
          leakProof: 99,
          retention: 48,
          duration: 2,
          ease: 'power3.out',
          onUpdate: () => {
            setStats({
              countries: Math.round(statsObj.countries),
              customers: Math.round(statsObj.customers),
              leakProof: Math.round(statsObj.leakProof),
              retention: Math.round(statsObj.retention),
            });
          },
        });
      },
    });
  }, []);

  // Section 3: Exploded View Interactive Scrub
  useEffect(() => {
    const container = explodedRef.current;
    if (!container) return;

    const explodedTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 60%',
        end: 'bottom 20%',
        scrub: 1,
      },
    });

    // Explode different layers outwards/vertically
    explodedTimeline
      .to('.exploded-cap', { y: -80, opacity: 0.9, duration: 1 })
      .to('.exploded-vacuum', { x: -60, opacity: 0.9, duration: 1 }, '-=1')
      .to('.exploded-steel', { x: 60, opacity: 0.9, duration: 1 }, '-=1')
      .to('.exploded-chamber', { y: 80, opacity: 0.9, duration: 1 }, '-=1')
      .to('.exploded-label', { opacity: 1, scale: 1, stagger: 0.15, duration: 0.8 }, '-=0.5');

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Section 4: Hydration Experience Canvas Animation (GPU-accelerated water simulation)
  useEffect(() => {
    const canvas = hydrationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 850);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Bubble and fluid structures
    interface Bubble {
      x: number;
      y: number;
      radius: number;
      vy: number;
      vx: number;
      alpha: number;
      pulseSpeed: number;
      phase: number;
    }

    const bubbles: Bubble[] = [];
    for (let i = 0; i < 45; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: height + Math.random() * 200,
        radius: Math.random() * 8 + 2,
        vy: -(Math.random() * 0.8 + 0.4),
        vx: Math.random() * 0.4 - 0.2,
        alpha: Math.random() * 0.4 + 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI,
      });
    }

    let time = 0;
    let animationFrameId: number;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render water depths radial gradients (liquid look)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(3, 3, 4, 1)');
      grad.addColorStop(0.5, 'rgba(17, 24, 39, 0.4)');
      grad.addColorStop(1, 'rgba(49, 46, 129, 0.18)'); // Soft indigo depths

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw procedural sine waves (flowing liquid blobs)
      ctx.fillStyle = 'rgba(79, 70, 229, 0.06)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 10) {
        const y = height - 60 + Math.sin(x * 0.008 + time) * 15 + Math.cos(x * 0.004 + time * 0.5) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.04)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 10) {
        const y = height - 50 + Math.cos(x * 0.006 + time * 1.2) * 12 + Math.sin(x * 0.003 + time * 0.8) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Render floating bubbles
      bubbles.forEach((b) => {
        b.y += b.vy;
        b.x += Math.sin(time * 0.5 + b.phase) * 0.25;

        // Reset once bubble leaves screen top
        if (b.y < -20) {
          b.y = height + Math.random() * 100;
          b.x = Math.random() * width;
        }

        // Blinking glow
        const currentAlpha = b.alpha * (0.6 + 0.4 * Math.sin(time + b.phase));

        const bubbleGrad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.1, b.x, b.y, b.radius);
        bubbleGrad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha})`);
        bubbleGrad.addColorStop(0.5, `rgba(99, 102, 241, ${currentAlpha * 0.4})`);
        bubbleGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.fillStyle = bubbleGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Review List
  const reviews: Review[] = [
    { id: 1, name: 'Adrian H.', role: 'Outdoor Guide', rating: 5, comment: 'The insulation performance is unmatched. Survived direct sun in Utah for 8 hours with freezing water.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { id: 2, name: 'Selena M.', role: 'Product Designer', rating: 5, comment: 'A masterpiece of minimalism. The tactile powder finish has an incredible grip, and the magnetic cap is brilliant.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 3, name: 'Marcus K.', role: 'Fitness Coach', rating: 5, comment: 'Rugged build quality. Dropped it on concrete multiple times, barely a scratch. Stays 100% leak proof.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { id: 4, name: 'Clara W.', role: 'Architect', rating: 5, comment: 'Elegant profiles that blend into any studio setup. Keeps my hot coffee fresh through long drafting days.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
  ];

  // FAQ List
  const faqs = [
    { question: 'How long does the vacuum thermal retention hold?', answer: 'ShopSphere Aqua keeps liquids cold for 48 hours and hot for up to 24 hours. This is driven by our double-walled medical-grade stainless steel shell and high-purity copper plating core.' },
    { question: 'Is the cap completely leak-proof?', answer: 'Yes. Our cap features a double-thread compression seal lined with food-grade non-toxic silicone. It prevents spills and drops even when stored upside down or subjected to pressure cycles.' },
    { question: 'Can I wash my bottle in the dishwasher?', answer: 'We recommend hand washing with warm water and soap to protect the premium matte powder coat finish. The internal stainless steel lining is polished and easy to clean.' },
    { question: 'Are the materials completely toxin-free?', answer: 'Absolutely. All parts of the bottle are 100% BPA-free, BPS-free, and phthalate-free. We use culinary 18/8 stainless steel to ensure zero flavor transfer.' },
  ];

  return (
    <div className="relative w-full overflow-hidden bg-[#030304] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Luxury Ambient Noise texture */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.015] bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZHRoPSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii41Ii8+Cjwvc3ZnPg==')]" />

      {/* Dynamic Background Glow meshes */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[5%] w-[40vw] h-[40vw] bg-purple-500/4 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[10%] w-[35vw] h-[35vw] bg-pink-500/3 rounded-full filter blur-[100px] pointer-events-none" />

      {/* --- SECTION 1 – PREMIUM MATERIALS --- */}
      <section id="materials" ref={materialsRef} className="relative py-28 md:py-40 px-6 max-w-7xl mx-auto border-t border-zinc-900/60 z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-6 space-y-6">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.25em] bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20">
              Computational Materials
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight font-serif">
              Crafted From<br />Premium Steel.
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg">
              Every container is constructed using medical-grade 18/8 Culinary Stainless Steel. Pure taste. Zero metal transfer. Resistant to physical impacts and scratch fatigue.
            </p>
            <div className="pt-4 flex gap-6 text-xs font-mono text-zinc-500">
              <div>
                <span className="block text-white font-bold text-lg font-serif">18%</span> Chromium Layer
              </div>
              <div className="border-l border-zinc-800 pl-6">
                <span className="block text-white font-bold text-lg font-serif">8%</span> Nickel Shield
              </div>
            </div>
          </div>

          <div className="md:col-span-6 flex justify-center">
            {/* Split Parallax Image Layout with Light Sweep */}
            <div className="relative group overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl shadow-2xl w-full max-w-lg aspect-[4/3] flex items-center justify-center">
              
              {/* Animated Light Sweep Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out skew-x-12 z-10" />

              <img
                src="https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800"
                alt="Stainless Steel Structure Model"
                className="w-full h-full object-cover rounded-2xl opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
                loading="lazy"
              />

              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-zinc-950/75 backdrop-blur border border-zinc-850 z-20">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Aesthetic Matrix</span>
                <p className="text-[11px] text-zinc-300 mt-1 leading-normal">Finished with dynamic grit powder shields to resist sweat and moisture slides.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- SECTION 2 – TEMPERATURE RETENTION --- */}
      <section id="temp-retention" ref={tempRef} className="relative py-28 md:py-36 border-t border-zinc-900/60 bg-gradient-to-b from-[#030304] via-[#09090c]/50 to-[#030304] z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Thermal Retentive Curve
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              KEEPS COLD. HOLDS HOT.
            </h2>
            <p className="text-zinc-400 text-sm">
              Select temperature matrix to observe relative timeline performance profiles.
            </p>

            {/* Toggle Switch */}
            <div className="inline-flex rounded-full bg-zinc-900/80 border border-zinc-800 p-1 mt-6">
              <button
                onClick={() => setTempMode('cold')}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  tempMode === 'cold' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Cold Protection
              </button>
              <button
                onClick={() => setTempMode('hot')}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  tempMode === 'hot' ? 'bg-pink-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Hot Lock
              </button>
            </div>
          </div>

          {/* Timeline chart wrapper */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-900/20 border border-zinc-900 rounded-3xl p-8 backdrop-blur-md max-w-4xl mx-auto">
            
            {/* Visual indicator (cold/hot theme) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-850/80 bg-zinc-950/40 relative overflow-hidden aspect-square">
              {/* Cold mist or hot steam animated glows */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 ${
                  tempMode === 'cold' ? 'bg-indigo-500/5 opacity-100' : 'bg-pink-500/5 opacity-100'
                }`}
              />
              
              <div className="relative z-10 text-center">
                {tempMode === 'cold' ? (
                  <>
                    <div className="text-5xl text-indigo-400 font-extrabold tracking-tight">48<span className="text-lg">hrs</span></div>
                    <div className="text-xs uppercase font-mono tracking-widest text-zinc-500 mt-2">Zero Sweat Cold</div>
                    <div className="mt-4 flex h-2 w-16 overflow-hidden rounded-full bg-zinc-900 mx-auto">
                      <div className="h-full w-full bg-indigo-500 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl text-pink-500 font-extrabold tracking-tight">24<span className="text-lg">hrs</span></div>
                    <div className="text-xs uppercase font-mono tracking-widest text-zinc-500 mt-2">Thermal Lock Hot</div>
                    <div className="mt-4 flex h-2 w-16 overflow-hidden rounded-full bg-zinc-900 mx-auto">
                      <div className="h-full w-full bg-pink-500 animate-pulse" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Performance charts comparison */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Timeline Comparison</h3>
              
              <div className="space-y-4">
                {/* ShopSphere Performance */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-zinc-200">ShopSphere Aqua</span>
                    <span className={tempMode === 'cold' ? 'text-indigo-400' : 'text-pink-500'}>
                      {tempMode === 'cold' ? 'Stays 3°C (99% Efficiency)' : 'Stays 85°C (98% Efficiency)'}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div
                      key={tempMode}
                      initial={{ width: 0 }}
                      animate={{ width: '98%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className={`h-full rounded-full ${tempMode === 'cold' ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-gradient-to-r from-pink-500 to-amber-500'}`}
                    />
                  </div>
                </div>

                {/* Generic Container Performance */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-zinc-500">
                    <span>Generic Containers</span>
                    <span>{tempMode === 'cold' ? 'Rises to 24°C after 6 hours' : 'Drops to 30°C after 6 hours'}</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div
                      key={tempMode}
                      initial={{ width: 0 }}
                      animate={{ width: '35%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full bg-zinc-800 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 leading-normal italic mt-4">
                *Results are measured under calibrated 32°C external ambient humidity cycles using thermal sensor matrix testing.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 3 – EXPLODED VIEW --- */}
      <section id="exploded-view" ref={explodedRef} className="relative py-28 md:py-40 px-6 max-w-7xl mx-auto border-t border-zinc-900/60 z-20">
        <div className="text-center max-w-xl mx-auto mb-20 space-y-3">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Structural Schematic
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            EXPLODED CORE DESIGN
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm">
            Scroll down to separate the core elements and explore each computational engineering shield layer.
          </p>
        </div>

        {/* Stack animation wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[60vh] max-w-4xl mx-auto">
          
          {/* Schematic visual layers stack */}
          <div className="md:col-span-6 relative flex flex-col items-center justify-center min-h-[380px] pointer-events-none">
            
            {/* Layer 1: Spout Cap */}
            <div className="exploded-cap w-24 h-16 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur flex items-center justify-center shadow-lg relative z-35">
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest">Magnetic Cap</span>
            </div>

            {/* Separation line spacer */}
            <div className="w-[1px] h-6 bg-dashed bg-gradient-to-b from-zinc-800 to-transparent" />

            {/* Layer 2: Vacuum Seal Layer */}
            <div className="exploded-vacuum w-36 h-20 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 backdrop-blur flex items-center justify-center shadow-lg relative z-30">
              <span className="text-[10px] text-indigo-300 uppercase font-mono tracking-widest">Vacuum Core</span>
            </div>

            <div className="w-[1px] h-6 bg-dashed bg-gradient-to-b from-zinc-800 to-transparent" />

            {/* Layer 3: Steel Shell */}
            <div className="exploded-steel w-40 h-24 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur flex items-center justify-center shadow-lg relative z-25">
              <span className="text-[10px] text-zinc-300 uppercase font-mono tracking-widest">Stainless Shell</span>
            </div>

            <div className="w-[1px] h-6 bg-dashed bg-gradient-to-b from-zinc-800 to-transparent" />

            {/* Layer 4: Inner Copper Shield */}
            <div className="exploded-chamber w-32 h-16 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur flex items-center justify-center shadow-lg relative z-20">
              <span className="text-[10px] text-amber-300 uppercase font-mono tracking-widest">Copper Plating</span>
            </div>

          </div>

          {/* Labels & Descriptions List */}
          <div className="md:col-span-6 space-y-6">
            {[
              { labelClass: 'exploded-cap', title: 'Magnetic Lock Spout Cap', desc: 'Secure compression seal layout hinges back during hydrate cycles to prevent collision.' },
              { labelClass: 'exploded-vacuum', title: 'Vacuum Core Chamber', desc: 'Double-walled empty matrix space devoid of air particles, blocking convection transfers.' },
              { labelClass: 'exploded-steel', title: 'Culinary Steel Exterior', desc: 'Sleek 18/8 culinary-grade stainless shell preventing impact dents and rust stains.' },
              { labelClass: 'exploded-chamber', title: 'Copper Thermal Plate', desc: 'Plated copper lining wrapping the inner bottle chamber, reflecting radiant heat spikes.' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="exploded-label opacity-0 scale-95 flex gap-4 p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 backdrop-blur-sm transition-colors hover:border-indigo-500/20"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-mono">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white tracking-wide">{item.title}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* --- SECTION 4 – HYDRATION EXPERIENCE --- */}
      <section className="relative py-28 md:py-36 border-t border-zinc-900/60 z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-[0.2em] bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Fluid Dynamics
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              PURE FLUID.<br />NO DISCORD.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              The internal capsule surface is optimized for seamless fluid runs. Water flows cleanly without microscopic build-ups or chemical leach.
            </p>
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Interactive water flow simulator</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Interactive GPU Water flow simulation canvas */}
            <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden border border-zinc-900 shadow-2xl bg-zinc-950">
              <canvas ref={hydrationCanvasRef} className="absolute inset-0 w-full h-full block" />
              <div className="absolute top-4 right-4 bg-zinc-950/70 border border-zinc-900 backdrop-blur rounded-full px-3 py-1 text-[9px] font-mono text-zinc-500 uppercase tracking-widest z-25">
                Active Simulation
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- SECTION 5 – PRODUCT COLORS --- */}
      <section id="colors" className="relative py-28 md:py-36 border-t border-zinc-900/60 z-20 bg-gradient-to-b from-[#030304] to-[#08080a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Mineral Colorways
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              SELECT YOUR ENERGY
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm">
              Explore available mineral selections. Tap to update the color matrix state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { id: 'default', title: 'Silver Matte', color: 'bg-zinc-300', hue: 'hue-rotate-0 saturate-100', desc: 'Culinary grade raw metal styling.' },
              { id: 'blue', title: 'Aurora Blue', color: 'bg-indigo-500', hue: 'hue-rotate-[145deg] saturate-125', desc: 'Rich polar sky twilight gradients.' },
              { id: 'purple', title: 'Velvet Purple', color: 'bg-purple-500', hue: 'hue-rotate-[285deg] saturate-125', desc: 'Deep volcanic mineral crystal hue.' },
              { id: 'gold', title: 'Alpine Gold', color: 'bg-amber-500', hue: 'hue-rotate-[35deg] saturate-125', desc: 'Golden sunlight reflecting snowy peaks.' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveColor(item.id as 'default' | 'blue' | 'purple' | 'gold')}
                className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 ${
                  activeColor === item.id
                    ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5 scale-102'
                    : 'border-zinc-850 hover:border-zinc-800 bg-zinc-900/10 hover:bg-zinc-900/20'
                }`}
              >
                {/* Visual bottle thumbnail container */}
                <div className="w-full aspect-[4/5] overflow-hidden rounded-xl bg-zinc-950/80 border border-zinc-900 flex items-center justify-center relative p-4 mb-4">
                  
                  {/* Subtle color highlight backdrop */}
                  <div className={`absolute inset-0 bg-radial-gradient transition-opacity duration-300 opacity-20 group-hover:opacity-45`} />

                  <img
                    src="/bottle/ezgif-frame-020.jpg"
                    alt={item.title}
                    className={`h-full w-auto object-contain transition-all duration-750 ease-out ${item.hue} group-hover:scale-108`}
                  />
                </div>

                <h4 className="text-xs font-bold text-white tracking-wider uppercase">{item.title}</h4>
                <p className="text-[10px] text-zinc-500 mt-1.5 leading-normal">{item.desc}</p>

                {/* Selected Accent Circle Indicator */}
                {activeColor === item.id && (
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500" />
                )}
              </button>
            ))}
          </div>

          <div className="text-center mt-12">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Selected Colorway: <span className="text-indigo-400 font-bold">{activeColor}</span>
            </span>
          </div>
        </div>
      </section>

      {/* --- NEON DATABASE COLLECTIONS SECTION --- */}
      <section id="collection" className="relative py-28 md:py-40 border-t border-zinc-900/60 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14">
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

          {/* Loading state */}
          {loadingProducts && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-zinc-900 bg-zinc-900/20 p-4">
                  <div className="aspect-square w-full rounded-xl bg-zinc-950" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-zinc-900" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-zinc-950" />
                  <div className="mt-6 flex justify-between">
                    <div className="h-5 w-16 rounded bg-zinc-900" />
                    <div className="h-4 w-10 rounded bg-zinc-900" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {errorProducts && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
              <p className="text-sm font-semibold">Failed to load collections: {errorProducts}</p>
            </div>
          )}

          {/* Render Products */}
          {!loadingProducts && !errorProducts && products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => {
                const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/10 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-850 hover:bg-zinc-900/20 hover:shadow-xl"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 rounded-lg bg-zinc-950/70 backdrop-blur px-2 py-1 text-[9px] font-semibold text-indigo-400 border border-zinc-900/60">
                        {product.brand?.name || 'Generic'}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 p-5">
                      <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                      <h3 className="mt-1.5 text-xs font-semibold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="mt-5 flex items-baseline justify-between pt-4 border-t border-zinc-950">
                        <span className="text-sm font-bold text-white">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-medium">
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

      {/* --- SECTION 6 – LIFESTYLE --- */}
      <section className="relative py-28 md:py-36 border-t border-zinc-900/60 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
              Editorial Showcase
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-2">
              ADAPTIVE PRESENCE
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm mt-1 max-w-sm leading-normal">
              Seamlessly integrates into every dynamic workspace and climate challenge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { id: 'adv', title: 'ADVENTURE', desc: 'Survives the polar peaks and mountain ridges.', img: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600' },
              { id: 'off', title: 'OFFICE', desc: 'Sits cleanly in executive architectural studios.', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600' },
              { id: 'gym', title: 'GYM', desc: 'Secure grip through maximum intensity athletic sessions.', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600' },
              { id: 'trv', title: 'TRAVEL', desc: 'Double compression leaks-safeguards in high altitudes.', img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600' },
            ].map((item, idx) => (
              <div
                key={item.id}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-900 shadow-xl"
              >
                {/* Background image with parallax scale */}
                <img
                  src={item.img}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                  loading="lazy"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70 group-hover:opacity-60 transition-opacity duration-300" />

                {/* Card text */}
                <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col justify-end">
                  <span className="text-[10px] font-mono text-zinc-500">0{idx + 1}</span>
                  <h3 className="text-sm font-black text-white tracking-widest uppercase mt-1">{item.title}</h3>
                  <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 7 – FEATURES --- */}
      <section className="relative py-28 md:py-36 border-t border-zinc-900/60 z-20 bg-gradient-to-b from-[#030304] to-[#08080a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
              Performance Matrix
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              ENGINEERED ADVANTAGE
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm">
              Explore the individual design features built to streamline your hydration cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🛡️', title: 'Copper Heat Reflect Shield', desc: 'A copper plating shields the inner compartment to reflect radiant thermal waves back inside, doubling heat lock levels.' },
              { icon: '🔒', title: 'Double Compression Cap', desc: 'Secure double threads coupled with food-grade compression seal ensures 100% leak proof performance under pressure.' },
              { icon: '💨', title: 'Sweat Proof Matrix Coat', desc: 'Proprietary matte powder coat prevents condensation slides, staying dry under maximum summer humidity sweeps.' },
              { icon: '🔋', title: 'Eco Carbon Reduction', desc: 'Built to last decades. Prevents thousands of disposable plastic units from filling landfills and polluting global channels.' },
              { icon: '🌱', title: '100% BPA Free Internals', desc: 'Internal culinary stainless chamber guarantees pure flavor without transferring harmful chemicals or plastic slide components.' },
              { icon: '⚡', title: 'Magnetic Hinge Anchor', desc: 'Integrated lid magnet locks the spout cap cleanly back during drink loops to protect eye coordinates and nose slides.' }
            ].map((card, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-2xl border border-zinc-850/60 bg-zinc-900/10 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/20 hover:bg-zinc-900/30 hover:-translate-y-1 shadow-lg"
              >
                <div className="text-2xl mb-4 bg-zinc-950 h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-900">
                  {card.icon}
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{card.title}</h4>
                <p className="text-[10px] text-zinc-400 mt-2.5 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 8 – CUSTOMER REVIEWS --- */}
      <section className="relative py-24 border-t border-zinc-900/60 overflow-hidden z-20 bg-gradient-to-b from-[#08080a] to-[#030304]">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
              Global Ratings
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-1">
              THE AUDIENCE SPEAKS
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-mono text-indigo-400 font-bold">4.9 / 5.0</span>
            <span className="text-zinc-600 text-xs font-mono">from 15,000+ audited verified reviews</span>
          </div>
        </div>

        {/* Auto Scrolling Marquee container */}
        <div className="flex flex-col gap-6 w-full relative">
          
          {/* Fading left/right bounds shadows */}
          <div className="absolute top-0 bottom-0 left-0 w-28 bg-gradient-to-r from-[#030304] to-transparent z-15 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-28 bg-gradient-to-l from-[#030304] to-transparent z-15 pointer-events-none" />

          {/* Marquee Row */}
          <div className="flex gap-6 w-max animate-[marquee_25s_linear_infinite]">
            {/* Double the array for infinite loops */}
            {[...reviews, ...reviews].map((rev, index) => (
              <div
                key={index}
                className="w-[300px] shrink-0 p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 backdrop-blur-sm shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-amber-500 gap-0.5 text-xs">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-300 mt-3 leading-relaxed">
                    &quot;{rev.comment}&quot;
                  </p>
                </div>

                <div className="flex gap-3 items-center mt-6 border-t border-zinc-950 pt-4">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="h-8 w-8 rounded-full object-cover border border-zinc-800"
                  />
                  <div>
                    <h5 className="text-[10px] font-bold text-white">{rev.name}</h5>
                    <span className="text-[9px] text-zinc-500 font-medium">{rev.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 9 – STATISTICS --- */}
      <section ref={statsSectionRef} className="relative py-28 md:py-36 border-t border-zinc-900/60 z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: stats.countries, prefix: '', suffix: '+', label: 'Countries Shipped' },
            { value: stats.customers, prefix: '', suffix: 'M+', label: 'Global Customers' },
            { value: stats.leakProof, prefix: '', suffix: '%', label: 'Leak Proof Guarantee' },
            { value: stats.retention, prefix: '', suffix: ' hrs', label: 'Thermal Retention' },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl border border-zinc-900/80 bg-zinc-950/40 backdrop-blur-md relative overflow-hidden"
            >
              {/* Counter glow */}
              <div className="absolute inset-0 bg-indigo-500/2 filter blur-md" />
              <div className="relative z-10">
                <div className="text-4xl md:text-6xl font-black text-white tracking-tight font-mono leading-none">
                  {stat.prefix}
                  {stat.value}
                  {stat.suffix}
                </div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mt-3 font-semibold">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="relative py-28 md:py-36 border-t border-zinc-900/60 z-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 space-y-3">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
            Faq Shield
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            QUESTIONS ANSWERED
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-900 bg-zinc-900/10 overflow-hidden backdrop-blur-sm"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
              >
                <span className="text-xs md:text-sm font-semibold text-white">{faq.question}</span>
                <span className={`text-zinc-500 text-lg transition-transform duration-300 ${activeFaq === i ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-zinc-950 bg-zinc-950/20"
                  >
                    <p className="p-6 text-[10px] md:text-xs text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* --- NEWSLETTER SECTION --- */}
      <section className="relative py-28 md:py-36 border-t border-zinc-900/60 z-20 max-w-4xl mx-auto px-6 text-center">
        <div className="relative z-10 max-w-lg mx-auto space-y-6">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Chronicle Update
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            JOIN THE MATRIX
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-sm mx-auto">
            Receive premium design chronicles, drop notifications, and private thermal specs directly in your mailbox.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 pt-4">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-5 py-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-zinc-500 backdrop-blur shadow-inner transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* --- SECTION 10 – FINAL CTA --- */}
      <section className="relative py-32 md:py-48 px-6 text-center border-t border-zinc-900/60 z-20 overflow-hidden bg-gradient-to-b from-[#030304] via-[#08080a] to-[#030304]">
        
        {/* Glowing background particles or ambient rays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-radial-gradient from-indigo-600/5 to-transparent filter blur-[100px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.25em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Secure Your Setup
          </span>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none">
            HYDRATE SMARTER.<br />LIVE BETTER.
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            Own the pinnacle of daily thermal design. Order your ShopSphere Aqua shield today.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
            <button
              onClick={() => {
                const el = document.getElementById('collection');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/15 hover:shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
            >
              Shop Collection
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('materials');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-widest transition-colors duration-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-16 text-center text-[10px] text-zinc-500 z-20 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-left mb-12">
          
          <div className="space-y-4">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Products</h5>
            <ul className="space-y-2 font-medium">
              <li><a href="#materials" className="hover:text-indigo-400 transition-colors">Culinary Stainless</a></li>
              <li><a href="#colors" className="hover:text-indigo-400 transition-colors">Mineral Colors</a></li>
              <li><a href="#temp-retention" className="hover:text-indigo-400 transition-colors">Thermal Locks</a></li>
              <li><a href="#exploded-view" className="hover:text-indigo-400 transition-colors">Exploded Config</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Sustainability</h5>
            <ul className="space-y-2 font-medium">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Carbon Shield</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Landfill Defense</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Corporate Grants</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Green Shipping</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Support</h5>
            <ul className="space-y-2 font-medium">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Customer Care</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Ship Logistics</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Warranty Lock</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Corporate Inquire</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold text-white uppercase tracking-wider text-xs">Brand</h5>
            <p className="text-zinc-500 leading-normal max-w-[200px]">
              ShopSphere Aqua represents the pinnacle of premium industrial fluid design. Built to endure decades.
            </p>
          </div>

        </div>

        <div className="border-t border-zinc-900 pt-8 max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-medium">&copy; 2026 ShopSphere Aqua Inc. Crafted for luxury daily performance.</p>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Regulatory Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
