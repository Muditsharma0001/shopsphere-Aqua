'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon' | 'loading';
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export default function Button({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  title,
}: ButtonProps) {
  
  const baseClasses = 'relative px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 focus:outline-none select-none flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-[var(--accent-color)] hover:brightness-110 text-white shadow-lg shadow-[var(--accent-glow)] active:scale-[0.98]',
    secondary: 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-850 active:scale-[0.98]',
    outline: 'border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent active:scale-[0.98]',
    ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-primary)] bg-transparent',
    icon: 'p-2 rounded-full border border-[var(--border-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all',
    loading: 'bg-[var(--accent-color)]/60 text-white cursor-not-allowed',
  };

  const selectedVariant = isLoading ? variants.loading : variants[variant];

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${selectedVariant} ${className}`}
      disabled={isLoading || disabled}
      onClick={onClick}
      type={type}
      title={title}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
