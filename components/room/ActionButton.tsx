'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { RoomAction } from '@/lib/types';

interface Burst {
  id: number;
  dx: number;
  dy: number;
  glyph: string;
}

const BURST_GLYPHS: Record<string, string[]> = {
  burst: ['💕', '✨', '💫'],
  kiss: ['💋', '💕', '✨'],
  hug: ['🤗', '💞', '🌸'],
  heart: ['❤️', '💖', '💕'],
  soft: ['🥺', '💧', '💕'],
  shake: ['😤', '💗', '✨']
};

interface Props {
  action: RoomAction;
  count: number;
  onSend: (action: RoomAction) => void;
}

const HOLD_DURATION = 1200;

export function ActionButton({ action, count, onSend }: Props) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const burstId = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStart = useRef(0);

  function spawnBurst() {
    const glyphs = BURST_GLYPHS[action.effect] || BURST_GLYPHS.burst;
    const next: Burst[] = Array.from({ length: 6 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 50;
      return {
        id: ++burstId.current,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 30,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)]
      };
    });
    setBursts((b) => [...b, ...next]);
    setTimeout(() => setBursts((b) => b.slice(next.length)), 1200);
  }

  function fire() {
    spawnBurst();
    navigator.vibrate?.(60);
    onSend(action);
  }

  function startHold() {
    if (!action.hold) return;
    setHolding(true);
    holdStart.current = Date.now();
    holdTimer.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - holdStart.current) / HOLD_DURATION) * 100);
      setProgress(pct);
    }, 30);
  }

  function endHold() {
    if (!action.hold) return;
    if (holdTimer.current) clearInterval(holdTimer.current);
    const held = Date.now() - holdStart.current;
    setHolding(false);
    setProgress(0);
    if (held > 150) fire();
  }

  function handleClick() {
    if (action.hold) return; // hold handled separately
    fire();
  }

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={() => holding && endHold()}
      className={`focus-ring relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 bg-surface-2/50 px-2 py-3 transition-colors ${
        holding ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/50'
      }`}
    >
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, x: b.dx, y: b.dy, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-1/2 text-xl"
          >
            {b.glyph}
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.span
        className="text-3xl"
        animate={holding ? { scale: [1, 1.18, 1] } : {}}
        transition={{ duration: 0.6, repeat: holding ? Infinity : 0 }}
      >
        {action.emoji}
      </motion.span>
      <span className="text-sm font-bold leading-tight">{action.label}</span>
      <span className="text-xs text-muted">{count} lần</span>

      {action.hold && (
        <span className="absolute inset-x-0 bottom-0 h-1.5 bg-transparent">
          <span className="grad-primary block h-full transition-[width] duration-75" style={{ width: `${progress}%` }} />
        </span>
      )}
    </motion.button>
  );
}
