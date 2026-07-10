'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  blinkSpeed: number;
  phase: number;
  parallaxFactor: number;
}

export default function PremiumShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Direct DOM refs to avoid React re-renders during scroll
  const titleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const actionCardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // States
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<'default' | 'blue' | 'purple' | 'gold'>('default');

  // Animation proxy state
  const stateRef = useRef({
    frame: 0,
    spotlightIntensity: 0.8,
    smokeDensity: 0.6,
  });

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameCount = 51;

  // Particle systems
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // Preload all 51 frames before animation starts
  useEffect(() => {
    let loadedCount = 0;
    const preloadedImages: HTMLImageElement[] = [];

    const onLoad = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / frameCount) * 100);
      setPreloadProgress(pct);

      if (loadedCount === frameCount) {
        imagesRef.current = preloadedImages;
        setImagesLoaded(true);
      }
    };

    const onError = (e: Event | string) => {
      console.error('Failed to load frame', e);
      onLoad(); // increment to prevent preloader stalling
    };

    for (let i = 1; i <= frameCount; i++) {
      const img = new window.Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/bottle/ezgif-frame-${frameNum}.jpg`;
      img.onload = onLoad;
      img.onerror = onError;
      preloadedImages.push(img);
    }
  }, []);

  // Initialize Particles (Stars & Smoke) once images are loaded
  useEffect(() => {
    if (!imagesLoaded) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create twinkling starfield
    const tempStars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      tempStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.4,
        baseAlpha: Math.random() * 0.45 + 0.1,
        blinkSpeed: Math.random() * 0.015 + 0.005,
        phase: Math.random() * Math.PI * 2,
        parallaxFactor: Math.random() * 0.15 + 0.05, // background parallax drift
      });
    }
    starsRef.current = tempStars;

    // Create smoke plumes
    const tempSmoke: SmokeParticle[] = [];
    for (let i = 0; i < 30; i++) {
      tempSmoke.push(createSmokeParticle(width, height, true));
    }
    smokeParticlesRef.current = tempSmoke;
  }, [imagesLoaded]);

  // Helper to spawn a smoke particle
  const createSmokeParticle = (
    width: number,
    height: number,
    randomizeLife = false
  ): SmokeParticle => {
    const xBase = width / 2;
    const yBase = height / 2 + 150; // float up from below the bottle base
    
    const colors = [
      'rgba(99, 102, 241, ',  // Indigo
      'rgba(168, 85, 247, ',  // Purple
      'rgba(59, 130, 246, ',  // Blue
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const maxLife = Math.random() * 180 + 120;
    const life = randomizeLife ? Math.random() * maxLife : 0;

    return {
      x: xBase + (Math.random() * 140 - 70),
      y: yBase + (Math.random() * 60 - 30),
      vx: Math.random() * 0.4 - 0.2,
      vy: -(Math.random() * 0.7 + 0.3),
      radius: Math.random() * 35 + 20,
      alpha: 0,
      maxLife,
      life,
      color,
    };
  };

  // GSAP ScrollTrigger setup
  useEffect(() => {
    if (!imagesLoaded || !containerRef.current) return;

    const state = stateRef.current;

    // Create GSAP ScrollTrigger timeline to pin container
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5, // Direct sync to scroll with subtle smoothing
        pin: true, // PIN section while animating
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Reset overlay elements to transparent and offset
    gsap.set([titleRef.current, descRef.current, actionCardRef.current, featuresRef.current], {
      opacity: 0,
      y: 40,
    });

    // 1. Scrub the full 51 frame sequence. Bottle size remains cover-fixed, perfectly stable
    tl.to(state, {
      frame: frameCount - 1,
      ease: 'none',
      duration: 3,
    })
    // 2. Once the final frame finishes, fade in the product text overlay and features cards
    .to([titleRef.current, descRef.current, actionCardRef.current, featuresRef.current], {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 1.2,
      ease: 'power3.out',
    });

    return () => {
      // Clean up scroll trigger instances
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [imagesLoaded]);

  // RequestAnimationFrame Canvas Rendering Loop
  useEffect(() => {
    if (!imagesLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastResizeWidth = 0;
    let lastResizeHeight = 0;
    let localTime = 0;

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width !== lastResizeWidth || height !== lastResizeHeight) {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        
        lastResizeWidth = width;
        lastResizeHeight = height;
      }
    };

    // Run initial sizing
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      localTime += 16.7; // ms elapsed per frame approx

      const width = lastResizeWidth;
      const height = lastResizeHeight;

      if (width === 0 || height === 0) {
        animationFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const state = stateRef.current;

      // 1. Draw Spotlight Radial Background
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 5,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      
      const spotlightIntensity = state.spotlightIntensity;
      gradient.addColorStop(0, `rgba(79, 70, 229, ${spotlightIntensity * 0.22})`); // Soft indigo glow
      gradient.addColorStop(0.3, `rgba(168, 85, 247, ${spotlightIntensity * 0.09})`); // Deep violet mid-glow
      gradient.addColorStop(0.8, 'rgba(6, 6, 8, 0.45)');
      gradient.addColorStop(1, 'rgba(3, 3, 4, 1)'); // Dark edges

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Twinkling Starfield with scroll-driven Parallax
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      starsRef.current.forEach((star) => {
        star.phase += star.blinkSpeed;
        const currentAlpha = star.baseAlpha * (0.35 + 0.65 * Math.sin(star.phase));
        
        // Parallax y calculation
        let starY = star.y - scrollY * star.parallaxFactor;
        // Keep within viewport boundary
        if (starY < 0) {
          starY = height + (starY % height);
        } else if (starY > height) {
          starY = starY % height;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, starY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Smoke Particles (Behind Bottle)
      const smokeDensity = state.smokeDensity;
      smokeParticlesRef.current.forEach((p, idx) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.2; // expand radius

        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio < 0.15) {
          p.alpha = (lifeRatio / 0.15) * 0.08 * smokeDensity;
        } else {
          p.alpha = (1 - lifeRatio) * 0.08 * smokeDensity;
        }

        // Draw radial smoke puff
        const smokeGrad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
        smokeGrad.addColorStop(0, `${p.color}${p.alpha})`);
        smokeGrad.addColorStop(0.5, `${p.color}${p.alpha * 0.35})`);
        smokeGrad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Respawn particle at lifecycle end
        if (p.life >= p.maxLife) {
          smokeParticlesRef.current[idx] = createSmokeParticle(width, height, false);
        }
      });

      // 4. Draw Fullscreen Cinematic Centered Bottle Image Sequence (Cover mode)
      const currentFrame = Math.min(frameCount - 1, Math.max(0, Math.round(state.frame)));
      const bottleImg = imagesRef.current[currentFrame];

      if (bottleImg) {
        ctx.save();

        // Apply color variation hue-rotation filter
        let hueShift = 0;
        if (selectedColor === 'blue') hueShift = 145;
        else if (selectedColor === 'purple') hueShift = 285;
        else if (selectedColor === 'gold') hueShift = 35;

        if (hueShift > 0) {
          ctx.filter = `hue-rotate(${hueShift}deg) saturate(1.2) contrast(1.05)`;
        }

        // cover sizing logic
        const imgWidth = bottleImg.width;
        const imgHeight = bottleImg.height;
        const scaleX = width / imgWidth;
        const scaleY = height / imgHeight;
        const coverScale = Math.max(scaleX, scaleY);

        const drawWidth = imgWidth * coverScale;
        const drawHeight = imgHeight * coverScale;

        // Perfectly centered horizontally and vertically, no floating animation to keep it perfectly stable
        const drawX = (width - drawWidth) / 2;
        const drawY = (height - drawHeight) / 2;

        ctx.drawImage(bottleImg, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [imagesLoaded, selectedColor]);

  return (
    <div className="relative w-full">
      {/* 1. Preloader Overlay */}
      {!imagesLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030304]">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 shadow-2xl shadow-indigo-500/20">
            <span className="text-4xl font-extrabold text-white animate-pulse">S</span>
            <div className="absolute inset-0 rounded-2xl border border-white/20 animate-ping opacity-30" />
          </div>
          <h2 className="mt-10 text-xl font-bold tracking-tight text-white">
            Preloading Cinematic
          </h2>
          <p className="text-zinc-500 text-xs mt-1">Stitching high fidelity render sequence...</p>
          <div className="mt-6 h-1 w-60 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-100"
              style={{ width: `${preloadProgress}%` }}
            />
          </div>
          <span className="mt-2 text-xs font-mono text-zinc-500">{preloadProgress}%</span>
        </div>
      )}

      {/* 2. Pinning Container (Scroll Height controls scrub range) */}
      <div ref={containerRef} className="relative h-[250vh] bg-[#030304] select-none">
        
        {/* Sticky viewport frame wrapper */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {/* Main Rendering Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block z-0"
          />

          {/* Decorative left/right borders */}
          <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block" />
          <div className="absolute right-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block" />

          {/* --- CINEMATIC TEXT OVERLAY (Fades in after animation finishes) --- */}
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-16 pointer-events-none">
            <div className="w-full max-w-7xl h-full flex flex-col md:grid md:grid-cols-12 md:items-center gap-8 relative pointer-events-auto">
              
              {/* Left Column: Product Title & CTAs */}
              <div className="col-span-12 md:col-span-4 flex flex-col justify-center items-start text-left">
                <div ref={titleRef} className="opacity-0">
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    Pro-Grade Thermal Gear
                  </span>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none mt-4">
                    SHOPSPHERE<br />AQUA
                  </h1>
                </div>

                <p ref={descRef} className="mt-6 text-zinc-400 text-sm leading-relaxed max-w-sm opacity-0">
                  Engineered with double-wall vacuum copper lining. Zero thermal leaks. Custom designed grips. Your ideal hydration shield.
                </p>

                {/* Glassmorphic Selector & Buy Action Card */}
                <div 
                  ref={actionCardRef} 
                  className="mt-8 w-full max-w-xs rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 backdrop-blur-xl shadow-2xl opacity-0"
                >
                  <div className="flex justify-between items-center mb-3.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Shield</span>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                      {selectedColor === 'default' ? 'Silver Matte' : selectedColor === 'blue' ? 'Aurora Blue' : selectedColor === 'purple' ? 'Velvet Purple' : 'Alpine Gold'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {[
                      { id: 'default', color: 'bg-zinc-300' },
                      { id: 'blue', color: 'bg-indigo-500' },
                      { id: 'purple', color: 'bg-purple-500' },
                      { id: 'gold', color: 'bg-amber-500' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedColor(item.id as 'default' | 'blue' | 'purple' | 'gold')}
                        className={`relative flex-1 h-9 rounded-lg transition-all duration-200 flex items-center justify-center border ${
                          selectedColor === item.id 
                            ? 'border-indigo-500 bg-indigo-500/15' 
                            : 'border-zinc-850 bg-zinc-950/40'
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full ${item.color} shadow`} />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const el = document.getElementById('collection');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                  >
                    Shop Collection
                  </button>
                </div>
              </div>

              {/* Centered Spacer for Pinned Bottle */}
              <div className="col-span-12 md:col-span-4 h-48 md:h-full pointer-events-none" />

              {/* Right Column: Key Specifications / Features Cards */}
              <div ref={featuresRef} className="col-span-12 md:col-span-4 flex flex-col justify-center space-y-4 opacity-0">
                {[
                  { title: 'Vacuum Insulated Core', desc: 'Double-walled copper lining holds temperature for 24 hours.' },
                  { title: '18/8 Culinary Grade Steel', desc: 'Pro-grade stainless core resists stain, rust, and odours.' },
                  { title: 'Condensation Proof', desc: 'Zero-sweat outer grip powder coating stays completely dry.' },
                  { title: 'Magnetic Hinge Cap', desc: 'Compression seal magnetic cap stays back while drinking.' }
                ].map((feat, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 rounded-xl bg-zinc-900/35 border border-zinc-850/50 backdrop-blur-md transition-all duration-200 hover:border-indigo-500/20"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{feat.title}</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
