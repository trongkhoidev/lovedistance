'use client';

import { motion } from 'framer-motion';
import { PET_ACTIONS } from '@/lib/pet';
import type { PetActionKey } from '@/lib/types';

const COLORS: Record<string, string> = {
  feed: '#f59e0b',
  drink: '#38bdf8',
  walk: '#34d399',
  bath: '#2dd4bf',
  sleep: '#a78bfa',
  play: '#fb7185',
  pet: '#f472b6'
};

export function PetActions({ onAction, busy }: { onAction: (a: PetActionKey) => void; busy?: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
      {PET_ACTIONS.map((a) => {
        const c = COLORS[a.key] || '#0ea5e9';
        return (
          <motion.button
            key={a.key}
            whileTap={{ scale: 0.88, y: 2 }}
            whileHover={{ y: -3 }}
            disabled={busy}
            onClick={() => onAction(a.key)}
            className="focus-ring group flex flex-col items-center gap-1 disabled:opacity-50"
          >
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-3xl text-2xl shadow-pop transition-transform"
              style={{ background: `linear-gradient(160deg, ${c}, ${c}cc)`, boxShadow: `0 8px 0 -2px ${c}77, 0 10px 18px -6px ${c}aa` }}
            >
              <span className="absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/40 blur-[1px]" />
              <span className="relative drop-shadow">{a.emoji}</span>
            </span>
            <span className="text-[0.7rem] font-bold leading-tight text-text">{a.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
