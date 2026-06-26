'use client';

import { motion } from 'framer-motion';
import { PET_ACTIONS, recommendedAction } from '@/lib/pet';
import type { Pet, PetActionKey, PetStatKey } from '@/lib/types';

const COLORS: Record<string, string> = {
  feed: '#f59e0b',
  drink: '#38bdf8',
  walk: '#34d399',
  bath: '#2dd4bf',
  sleep: '#a78bfa',
  play: '#fb7185',
  pet: '#f472b6'
};

// stat each action targets (for "đã đủ" / "cần" hints)
const TARGET: Partial<Record<PetActionKey, PetStatKey>> = {
  feed: 'fullness',
  drink: 'hydration',
  bath: 'cleanliness',
  sleep: 'energy'
};

export function PetActions({ pet, onAction, busy }: { pet: Pet; onAction: (a: PetActionKey) => void; busy?: boolean }) {
  const recommended = recommendedAction(pet);
  const tired = pet.energy < 15;

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
      {PET_ACTIONS.map((a) => {
        const c = COLORS[a.key] || '#0ea5e9';
        const target = TARGET[a.key];
        const satisfied = target ? pet[target] >= 92 : false;
        const blockedTired = (a.key === 'play' || a.key === 'walk') && tired;
        const dim = satisfied || blockedTired;
        const isRec = recommended === a.key;

        return (
          <motion.button
            key={a.key}
            whileTap={{ scale: 0.88, y: 2 }}
            whileHover={{ y: -3 }}
            disabled={busy}
            onClick={() => onAction(a.key)}
            className={`focus-ring group relative flex flex-col items-center gap-1 disabled:opacity-50 ${dim ? 'opacity-45' : ''}`}
          >
            {isRec && (
              <motion.span
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1.5 z-10 rounded-pill bg-love px-1.5 text-[0.55rem] font-black text-white shadow"
              >
                cần!
              </motion.span>
            )}
            <span
              className={`relative flex h-14 w-14 items-center justify-center rounded-3xl text-2xl shadow-pop transition-transform ${
                isRec ? 'ring-4 ring-love/50' : ''
              }`}
              style={{ background: `linear-gradient(160deg, ${c}, ${c}cc)`, boxShadow: `0 8px 0 -2px ${c}77, 0 10px 18px -6px ${c}aa` }}
            >
              <span className="absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/40 blur-[1px]" />
              <span className="relative drop-shadow">{a.emoji}</span>
              {satisfied && <span className="absolute -bottom-1 right-0 text-xs">✅</span>}
              {blockedTired && <span className="absolute -bottom-1 right-0 text-xs">😴</span>}
            </span>
            <span className="text-[0.7rem] font-bold leading-tight text-text">{a.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
