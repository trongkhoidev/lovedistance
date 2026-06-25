'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { RoomAction } from '@/lib/types';

interface Ripple {
  id: number;
}

interface Props {
  action: RoomAction;
  count: number;
  color: string;
  onSend: (action: RoomAction) => void;
}

const HOLD_MS = 1100;
const COMBO_WINDOW = 1600;

export function EmotionButton({ action, count, color, onSend }: Props) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [combo, setCombo] = useState(0);
  const rid = useRef(0);
  const lastSent = useRef(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIv = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStart = useRef(0);

  function bumpCombo() {
    const now = Date.now();
    const next = now - lastSent.current < COMBO_WINDOW ? combo + 1 : 1;
    lastSent.current = now;
    setCombo(next);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), COMBO_WINDOW);
  }

  function fire() {
    const id = ++rid.current;
    setRipples((r) => [...r, { id }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 700);
    bumpCombo();
    navigator.vibrate?.(35);
    onSend(action);
  }

  function startHold() {
    if (!action.hold) return;
    setHolding(true);
    holdStart.current = Date.now();
    holdIv.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - holdStart.current) / HOLD_MS) * 100);
      setProgress(pct);
    }, 30);
  }
  function endHold() {
    if (!action.hold) return;
    if (holdIv.current) clearInterval(holdIv.current);
    const held = Date.now() - holdStart.current;
    setHolding(false);
    setProgress(0);
    if (held > 120) fire();
  }

  const r = 30;
  const circ = 2 * Math.PI * r;

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      whileHover={{ y: -3 }}
      onClick={() => !action.hold && fire()}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={() => holding && endHold()}
      onPointerCancel={endHold}
      className="focus-ring relative flex select-none flex-col items-center gap-1 overflow-hidden rounded-3xl border border-white/20 p-3 text-white shadow-pop"
      style={{ background: `linear-gradient(160deg, ${color}, ${color}cc)` }}
    >
      {/* glossy top */}
      <span className="pointer-events-none absolute inset-x-3 top-2 h-4 rounded-full bg-white/30 blur-[1px]" />

      {/* ripples */}
      <AnimatePresence>
        {ripples.map((rp) => (
          <motion.span
            key={rp.id}
            className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40"
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* hold progress ring */}
      {action.hold && holding && (
        <svg className="pointer-events-none absolute inset-0 m-auto h-[72px] w-[72px] -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (progress / 100) * circ}
          />
        </svg>
      )}

      <motion.span
        className="relative text-3xl drop-shadow"
        animate={holding ? { scale: [1, 1.18, 1] } : { y: [0, -3, 0] }}
        transition={{ duration: holding ? 0.5 : 2.5, repeat: Infinity }}
      >
        {action.emoji}
      </motion.span>
      <span className="relative text-sm font-bold leading-tight">{action.label}</span>
      <span className="relative rounded-pill bg-black/15 px-2 text-[0.7rem] font-bold">{count}</span>

      {/* combo badge */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.span
            key={combo}
            initial={{ scale: 0, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -right-1 -top-1 rounded-full bg-sun px-2 py-0.5 text-xs font-black text-deep shadow"
          >
            x{combo}🔥
          </motion.span>
        )}
      </AnimatePresence>

      {action.hold && !holding && (
        <span className="absolute bottom-1 text-[0.6rem] font-bold text-white/70">giữ ✊</span>
      )}
    </motion.button>
  );
}
