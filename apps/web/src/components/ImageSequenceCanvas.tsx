'use client';

import { useEffect, useState, useRef } from 'react';

interface ImageSequenceCanvasProps {
  folderPath: string;
  fileNamePrefix: string;
  frameCount: number;
  padLength?: number;
  fileExtension?: string;
  progress: number; // Scroll progress (0 to 1)
  selectedColor?: 'default' | 'blue' | 'purple' | 'gold';
  xOffsetPercent?: number; // Offset horizontal center (-100 to 100)
  scaleFactor?: number; // Base zoom scale factor
  className?: string;
  onLoadProgress?: (progress: number) => void;
  onLoadComplete?: () => void;
}

export default function ImageSequenceCanvas({
  folderPath,
  fileNamePrefix,
  frameCount,
  padLength = 3,
  fileExtension = '.jpg',
  progress,
  selectedColor = 'default',
  xOffsetPercent = 0,
  scaleFactor = 1.0,
  className = '',
  onLoadProgress,
  onLoadComplete,
}: ImageSequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<(HTMLImageElement | null)[]>([]);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [hasFinishedLoading, setHasFinishedLoading] = useState<boolean>(false);

  // Preload sequence
  useEffect(() => {
    let currentLoaded = 0;
    const imgList: (HTMLImageElement | null)[] = Array(frameCount).fill(null);

    // Standardize folder path
    const folder = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

    for (let i = 1; i <= frameCount; i++) {
      const img = new window.Image();
      const frameNum = String(i).padStart(padLength, '0');
      
      img.src = `${folder}${fileNamePrefix}${frameNum}${fileExtension}`;
      
      const frameIndex = i - 1;
      
      img.onload = () => {
        imgList[frameIndex] = img;
        currentLoaded++;
        setLoadedCount(currentLoaded);
        if (onLoadProgress) {
          onLoadProgress(Math.round((currentLoaded / frameCount) * 100));
        }

        if (currentLoaded === frameCount) {
          setHasFinishedLoading(true);
          if (onLoadComplete) onLoadComplete();
        }
      };

      img.onerror = () => {
        console.warn(`Failed to load frame ${i} at: ${img.src}`);
        // Keep it null or assign a fallback image or handle gracefully
        imgList[frameIndex] = null;
        currentLoaded++;
        setLoadedCount(currentLoaded);
        if (currentLoaded === frameCount) {
          setHasFinishedLoading(true);
          if (onLoadComplete) onLoadComplete();
        }
      };
    }
    
    setImages(imgList);
  }, [folderPath, fileNamePrefix, frameCount, padLength, fileExtension]);

  // Canvas drawing logic
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 600;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Safe frame index resolution
    const totalFrames = images.length;
    const rawFrame = Math.floor(progress * totalFrames);
    const targetFrameIndex = Math.min(totalFrames - 1, Math.max(0, rawFrame));

    // Fallback logic for missing frames: search for closest valid frame
    let img = images[targetFrameIndex];
    if (!img) {
      // Find closest successfully loaded frame
      let fallbackIndex = -1;
      let minDistance = Infinity;
      for (let i = 0; i < totalFrames; i++) {
        if (images[i] !== null) {
          const dist = Math.abs(i - targetFrameIndex);
          if (dist < minDistance) {
            minDistance = dist;
            fallbackIndex = i;
          }
        }
      }
      if (fallbackIndex !== -1) {
        img = images[fallbackIndex];
      }
    }

    if (!img) return; // No frames loaded at all yet

    ctx.clearRect(0, 0, width, height);

    // Apply color variants shifting via canvas filter
    let hueShift = 0;
    if (selectedColor === 'blue') hueShift = 140;
    else if (selectedColor === 'purple') hueShift = 280;
    else if (selectedColor === 'gold') hueShift = 45;

    if (hueShift > 0) {
      ctx.filter = `hue-rotate(${hueShift}deg) saturate(1.2)`;
    } else {
      ctx.filter = 'none';
    }

    // Centered aspect scaled drawing
    const imgRatio = img.width / img.height;
    let drawWidth = width * 0.65 * scaleFactor;
    let drawHeight = drawWidth / imgRatio;

    if (drawHeight > height * 0.75) {
      drawHeight = height * 0.75 * scaleFactor;
      drawWidth = drawHeight * imgRatio;
    }

    const xOffset = (xOffsetPercent / 100) * width;
    const x = (width - drawWidth) / 2 + xOffset;
    const y = (height - drawHeight) / 2;

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  };

  // Re-draw on state, progress, or resize changes
  useEffect(() => {
    drawCanvas();
  }, [images, loadedCount, hasFinishedLoading, progress, selectedColor, xOffsetPercent, scaleFactor]);

  useEffect(() => {
    const handleResize = () => {
      drawCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [images, progress, selectedColor, xOffsetPercent, scaleFactor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      style={{ display: 'block' }}
    />
  );
}
