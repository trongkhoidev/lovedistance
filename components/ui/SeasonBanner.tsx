'use client';

import { motion } from 'framer-motion';
import type { Season } from '@/lib/season';

export function SeasonBanner({ season }: { season: Season | null }) {
  if (!season) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 flex items-center justify-center gap-2 rounded-pill px-4 py-1.5 text-sm font-bold text-white shadow-soft"
      style={{ background: `linear-gradient(90deg, ${season.accent.primary}, ${season.accent.love})` }}
    >
      <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        {season.emoji}
      </motion.span>
      <span className="truncate">{season.greeting}</span>
    </motion.div>
  );
}
