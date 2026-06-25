'use client';

import { motion } from 'framer-motion';

interface Props {
  label: string;
  emoji: string;
  value: number; // 0-100
  color: string; // hex
}

export function StatBar({ label, emoji, value, color }: Props) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const low = v < 25;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1 text-muted">
          <span aria-hidden>{emoji}</span>
          {label}
        </span>
        <span className={low ? 'text-love' : 'text-text'}>{v}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-pill bg-surface-2">
        <motion.div
          className="h-full rounded-pill"
          style={{ backgroundColor: color }}
          initial={false}
          animate={{ width: `${v}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        />
      </div>
    </div>
  );
}
