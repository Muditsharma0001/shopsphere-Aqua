'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  hoverLift = true,
  onClick,
}: CardProps) {
  
  const baseClasses = 'relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-surface)] backdrop-blur-md transition-all duration-300';
  
  return (
    <motion.div
      layout
      whileHover={hoverLift ? { y: -5, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)' } : undefined}
      onClick={onClick}
      className={`${baseClasses} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Decorative interior subtle reflection sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/2 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
