'use client';

import { motion } from 'framer-motion';
import { PET_EMOJI } from '@/lib/pet';
import { SHOP_MAP } from '@/lib/shop';
import type { Pet, Inventory } from '@/lib/types';

interface Props {
  pet: Pet;
  inventory: Inventory;
  reaction?: { id: number; emoji: string } | null;
  size?: number;
}

const MOOD_FACE: Record<string, string> = {
  sleepy: '😴',
  hungry: '🥺',
  thirsty: '😣',
  messy: '😖',
  joyful: '😆',
  sad: '😢',
  content: '😊',
  excited: '🤩',
  loved: '🥰',
  curious: '🙂'
};

export function PetSprite({ pet, inventory, reaction, size = 120 }: Props) {
  const base = PET_EMOJI[pet.type] || '🦭';
  const hat = inventory.equipped.hat ? SHOP_MAP[inventory.equipped.hat]?.emoji : null;
  const outfit = inventory.equipped.outfit ? SHOP_MAP[inventory.equipped.outfit]?.emoji : null;
  const face = MOOD_FACE[pet.mood] || '🙂';

  return (
    <div className="relative flex items-end justify-center" style={{ height: size * 1.5, width: size * 1.5 }}>
      {/* shadow */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-[50%] bg-deep/20 blur-md"
        style={{ width: size * 0.7, height: size * 0.16 }}
      />

      <motion.div
        className="relative"
        animate={{ y: [0, -10, 0], x: [0, 6, -6, 0] }}
        transition={{ y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }, x: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }}
        key={reaction?.id /* re-trigger pop on reaction */}
      >
        <motion.div
          animate={reaction ? { scale: [1, 1.25, 0.95, 1], rotate: [0, -8, 8, 0] } : {}}
          transition={{ duration: 0.7 }}
          style={{ fontSize: size }}
          className="leading-none drop-shadow-lg"
        >
          {base}
        </motion.div>

        {/* hat */}
        {hat && (
          <span className="absolute left-1/2 -translate-x-1/2 select-none" style={{ top: -size * 0.32, fontSize: size * 0.5 }}>
            {hat}
          </span>
        )}
        {/* outfit */}
        {outfit && (
          <span className="absolute left-1/2 -translate-x-1/2 select-none" style={{ bottom: size * 0.02, fontSize: size * 0.42 }}>
            {outfit}
          </span>
        )}
        {/* mood face bubble */}
        <span className="absolute -right-1 -top-1 select-none rounded-full bg-surface/90 px-1 text-base shadow" style={{ fontSize: size * 0.22 }}>
          {face}
        </span>

        {/* reaction emoji floats up */}
        {reaction && (
          <motion.span
            key={reaction.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: -size * 0.9, scale: 1.3 }}
            transition={{ duration: 1.1 }}
            className="absolute left-1/2 top-0 -translate-x-1/2 select-none"
            style={{ fontSize: size * 0.4 }}
          >
            {reaction.emoji}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
