'use client';

import { motion } from 'framer-motion';

interface Props {
  label: string;
  emoji: string;
  value: number;
  color: string;
}

/** Game-style chunky gauge: icon chip + glossy filled bar. */
export function StatGauge({ label, emoji, value, color }: Props) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const low = v < 25;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg shadow-inner"
        style={{ backgroundColor: `${color}22`, boxShadow: `inset 0 0 0 2px ${color}55` }}
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between text-[0.7rem] font-bold">
          <span className="text-muted">{label}</span>
          <span className={low ? 'text-love' : 'text-text'}>{v}</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-pill bg-surface-2 shadow-inner">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-pill"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
            initial={false}
            animate={{ width: `${v}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-pill bg-white/30" />
          </motion.div>
          {low && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[0.6rem]">⚠️</span>}
        </div>
      </div>
    </div>
  );
}
