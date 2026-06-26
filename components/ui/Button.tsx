'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

type Variant = 'primary' | 'soft' | 'ghost' | 'love' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'grad-primary text-white shadow-pop',
  love: 'bg-love text-white shadow-pop',
  danger: 'bg-red-500 text-white shadow-pop hover:bg-red-600',
  soft: 'bg-surface-2 text-text hover:bg-surface-2/70 border border-border/60',
  outline: 'bg-transparent text-primary border-2 border-primary/40 hover:bg-primary/10',
  ghost: 'bg-transparent text-muted hover:text-text hover:bg-surface-2/60'
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-pill',
  md: 'px-5 py-2.5 text-[0.95rem] rounded-2xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl'
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className = '', children, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -1 }}
      className={`focus-ring inline-flex items-center justify-center gap-2 font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
