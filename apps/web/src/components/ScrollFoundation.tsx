'use client';

import { useEffect, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

interface ScrollFoundationProps {
  children: ReactNode;
}

export default function ScrollFoundation({ children }: ScrollFoundationProps) {
  useEffect(() => {
    // 1. Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 2. Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    // 3. Connect Lenis scroll event to ScrollTrigger update cycle
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // 4. Hook Lenis RAF into GSAP's ticker
    const tickHandler = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickHandler);

    // 5. Turn off default lag smoothing in GSAP for direct sync
    gsap.ticker.lagSmoothing(0);

    // Clean up
    return () => {
      gsap.ticker.remove(tickHandler);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
