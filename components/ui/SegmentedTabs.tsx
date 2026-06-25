'use client';

import { motion } from 'framer-motion';

export interface SegOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface Props<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  layoutId?: string;
}

export function SegmentedTabs<T extends string>({ options, value, onChange, size = 'md', layoutId = 'seg' }: Props<T>) {
  return (
    <div className={`inline-flex w-full rounded-pill bg-surface-2/70 p-1 ${size === 'sm' ? 'gap-0.5' : 'gap-1'}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`focus-ring relative flex-1 rounded-pill px-2 py-2 text-center font-bold transition-colors ${
              size === 'sm' ? 'text-xs' : 'text-sm'
            } ${active ? 'text-white' : 'text-muted hover:text-text'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="grad-primary absolute inset-0 rounded-pill shadow-pop"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">
              {opt.icon && <span className="mr-1">{opt.icon}</span>}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
