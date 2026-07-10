'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          if (nextTheme === 'light') {
            root.classList.add('light');
            root.style.colorScheme = 'light';
          } else {
            root.classList.remove('light');
            root.style.colorScheme = 'dark';
          }
        }
        
        set({ theme: nextTheme });
      },
    }),
    {
      name: 'shopsphere-theme-store',
      // Run once on load to synchronize client state to HTML class
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          const root = window.document.documentElement;
          if (state.theme === 'light') {
            root.classList.add('light');
            root.style.colorScheme = 'light';
          } else {
            root.classList.remove('light');
            root.style.colorScheme = 'dark';
          }
        }
      },
    }
  )
);
