'use client';

import { motion } from 'framer-motion';
import { useThemeMode } from '@/components/providers/ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, toggle } = useThemeMode();
  const dark = mode === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label="Đổi sáng/tối"
      className={`focus-ring relative flex h-9 w-16 items-center rounded-pill border border-border/70 bg-surface-2/80 px-1 ${className}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow ${
          dark ? 'ml-auto bg-deep text-aqua' : 'mr-auto grad-primary text-white'
        }`}
      >
        {dark ? '🌙' : '☀️'}
      </motion.span>
    </button>
  );
}
