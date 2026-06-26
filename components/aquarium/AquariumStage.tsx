'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { isSick, MOOD_LABEL, PET_EMOJI, petStage, xpProgress } from '@/lib/pet';
import { SHOP_MAP } from '@/lib/shop';
import type { Inventory, Pet } from '@/lib/types';

const MOOD_FACE: Record<string, string> = {
  sleepy: '😴', hungry: '🥺', thirsty: '😣', messy: '😖', joyful: '😆',
  sad: '😢', content: '😊', excited: '🤩', loved: '🥰', curious: '🙂', sick: '🤒', tired: '🥵'
};

const SCENE_TINT: Record<string, [string, string]> = {
  'scene-reef': ['#0e7490', '#0c4a6e'],
  'scene-sunset': ['#b45309', '#7c2d12']
};

interface Props {
  pet: Pet;
  inventory: Inventory;
  reaction?: { id: number; emoji: string } | null;
  height?: number;
}

export function AquariumStage({ pet, inventory, reaction, height = 300 }: Props) {
  const base = PET_EMOJI[pet.type] || '🦭';
  const hat = inventory.equipped.hat ? SHOP_MAP[inventory.equipped.hat]?.emoji : null;
  const outfit = inventory.equipped.outfit ? SHOP_MAP[inventory.equipped.outfit]?.emoji : null;
  const face = MOOD_FACE[pet.mood] || '🙂';
  const scene = inventory.equipped.scene;
  const tint = (scene && SCENE_TINT[scene]) || ['#0891b2', '#0c4a6e'];
  const xp = xpProgress(pet);
  const stage = petStage(pet.level);
  const sick = isSick(pet);

  const bubbles = useMemo(
    () => Array.from({ length: 9 }).map((_, i) => ({ id: i, left: 6 + i * 10 + (i % 3) * 3, size: 6 + (i % 4) * 5, dur: 4 + (i % 5), delay: -(i * 0.7) })),
    []
  );

  return (
    <div
      className="relative overflow-hidden rounded-card shadow-soft"
      style={{ height, background: `linear-gradient(180deg, ${tint[0]} 0%, ${tint[1]} 100%)` }}
    >
      {/* surface light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/40 to-transparent" />

      {/* light rays */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 left-1/4 h-[140%] w-24 rotate-12 bg-gradient-to-b from-white/40 to-transparent blur-md animate-[sway_9s_ease-in-out_infinite]" />
        <div className="absolute -top-10 left-1/2 h-[140%] w-16 rotate-6 bg-gradient-to-b from-white/30 to-transparent blur-md animate-[sway_11s_ease-in-out_infinite]" />
        <div className="absolute -top-10 right-1/4 h-[140%] w-20 -rotate-6 bg-gradient-to-b from-white/30 to-transparent blur-md animate-[sway_13s_ease-in-out_infinite]" />
      </div>

      {/* caustics shimmer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen animate-[shimmer_6s_linear_infinite]"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.5) 0 2px, transparent 3px), radial-gradient(circle at 45% 80%, rgba(255,255,255,0.4) 0 2px, transparent 3px)',
          backgroundSize: '180px 180px'
        }}
      />

      {/* rising bubbles */}
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute bottom-0 rounded-full border border-white/40 bg-white/10 animate-[rise_var(--d)_linear_infinite]"
          style={{ left: `${b.left}%`, width: b.size, height: b.size, ['--d' as string]: `${b.dur}s`, animationDelay: `${b.delay}s` }}
        />
      ))}

      {/* far decor */}
      <span className="absolute bottom-6 left-[12%] text-4xl opacity-50 animate-[sway_5s_ease-in-out_infinite]">🌿</span>
      <span className="absolute bottom-4 left-[28%] text-3xl opacity-40 animate-[sway_6s_ease-in-out_infinite]">🪸</span>
      <span className="absolute bottom-5 right-[16%] text-4xl opacity-50 animate-[sway_7s_ease-in-out_infinite]">🌿</span>
      <span className="absolute bottom-3 right-[34%] text-2xl opacity-40">🐚</span>

      {/* swimming creature */}
      <motion.div
        className="absolute"
        style={{ top: '28%' }}
        animate={{ x: ['8%', '72%', '72%', '8%', '8%'], scaleX: [1, 1, -1, -1, 1] as number[] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 0.5, 0.95, 1] }}
      >
        <motion.div animate={{ y: [0, -10, 0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="relative">
          <motion.div
            key={reaction?.id}
            animate={reaction ? { scale: [1, 1.3, 0.95, 1], rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.7 }}
            className="relative leading-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
            style={{ fontSize: `${5.5 * stage.scale}rem`, filter: sick ? 'grayscale(0.45) brightness(0.92)' : 'none' }}
          >
            {base}
            {hat && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-5xl">{hat}</span>}
            {outfit && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-4xl">{outfit}</span>}
            <span className="absolute -right-2 -top-2 rounded-full bg-white/90 px-1 text-2xl shadow">{face}</span>
            {sick && <span className="absolute -left-3 top-0 text-3xl">🤒</span>}
          </motion.div>
          {reaction && (
            <motion.span
              key={`r-${reaction.id}`}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -80, scale: 1.4 }}
              transition={{ duration: 1.1 }}
              className="absolute left-1/2 top-0 -translate-x-1/2 text-4xl"
            >
              {reaction.emoji}
            </motion.span>
          )}
        </motion.div>
      </motion.div>

      {/* sandy floor */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-amber-200/40 to-transparent" />

      {/* name plate + level ring */}
      <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 rounded-pill bg-black/25 px-3 py-1 backdrop-blur-sm">
        <span className="relative flex h-7 w-7 items-center justify-center">
          <svg viewBox="0 0 36 36" className="absolute h-7 w-7 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${xp.ratio * 94} 94`} />
          </svg>
          <span className="text-[0.6rem] font-bold text-white">{pet.level}</span>
        </span>
        <span className="font-display text-base font-bold text-white drop-shadow">{pet.name}</span>
        <span className="text-xs text-white/80">· {MOOD_LABEL[pet.mood] || pet.mood}</span>
      </div>

      <style jsx>{`
        @keyframes rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          12% { opacity: 0.8; }
          100% { transform: translateY(-${height}px) translateX(10px); opacity: 0; }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes shimmer {
          0% { background-position: 0 0; }
          100% { background-position: 180px 90px; }
        }
      `}</style>
    </div>
  );
}
