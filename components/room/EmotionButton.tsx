'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { playSound, startCharge, stopCharge, type SoundName } from '@/lib/sounds';
import type { RoomAction } from '@/lib/types';

interface Props {
  action: RoomAction;
  count: number;
  color: string;
  onSend: (action: RoomAction, level: number) => void;
}

const CHARGE_FULL_MS = 2200;
const COMBO_WINDOW = 1600;

const SOUND_BY_KEY: Record<string, SoundName> = {
  kiss: 'kiss',
  hug: 'hug',
  heart: 'heart',
  miss: 'miss',
  angry: 'angry'
};

export function EmotionButton({ action, count, color, onSend }: Props) {
  const [charge, setCharge] = useState(0);
  const [charging, setCharging] = useState(false);
  const [combo, setCombo] = useState(0);
  const raf = useRef<number | null>(null);
  const startAt = useRef(0);
  const lastSent = useRef(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  function tick() {
    const pct = Math.min(1, (Date.now() - startAt.current) / CHARGE_FULL_MS);
    setCharge(pct);
    if (pct < 1) raf.current = requestAnimationFrame(tick);
  }

  function start() {
    if (charging) return;
    setCharging(true);
    startAt.current = Date.now();
    setCharge(0);
    raf.current = requestAnimationFrame(tick);
    startCharge();
  }

  function release() {
    if (!charging) return;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    stopCharge();
    const held = Date.now() - startAt.current;
    const pct = Math.min(1, held / CHARGE_FULL_MS);
    setCharging(false);
    setCharge(0);

    const level = pct >= 0.85 ? 3 : pct >= 0.45 ? 2 : 1;

    // combo
    const now = Date.now();
    const nextCombo = now - lastSent.current < COMBO_WINDOW ? combo + 1 : 1;
    lastSent.current = now;
    setCombo(nextCombo);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), COMBO_WINDOW);

    // sound + haptics
    playSound(SOUND_BY_KEY[action.key] || 'send', nextCombo);
    if (level === 3) playSound('mega');
    navigator.vibrate?.(level === 3 ? [40, 30, 80] : 35);

    onSend(action, level);
  }

  const ring = 30;
  const circ = 2 * Math.PI * ring;
  const previewScale = 0.6 + charge * 2.4;

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.93 }}
        whileHover={{ y: -3 }}
        onPointerDown={start}
        onPointerUp={release}
        onPointerLeave={() => charging && release()}
        onPointerCancel={release}
        className="focus-ring relative flex select-none flex-col items-center gap-1 overflow-hidden rounded-3xl border border-white/20 p-3 text-white shadow-pop"
        style={{ background: `linear-gradient(160deg, ${color}, ${color}cc)` }}
      >
        <span className="pointer-events-none absolute inset-x-3 top-2 h-4 rounded-full bg-white/30 blur-[1px]" />

        {charging && (
          <svg className="pointer-events-none absolute inset-0 m-auto h-[72px] w-[72px] -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={ring} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
            <circle
              cx="36"
              cy="36"
              r={ring}
              fill="none"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ - charge * circ}
            />
          </svg>
        )}

        <motion.span
          className="relative text-3xl drop-shadow"
          animate={charging ? { scale: 1 + charge * 0.5 } : { y: [0, -3, 0] }}
          transition={charging ? { duration: 0.1 } : { duration: 2.5, repeat: Infinity }}
        >
          {action.emoji}
        </motion.span>
        <span className="relative text-sm font-bold leading-tight">{action.label}</span>
        <span className="relative rounded-pill bg-black/15 px-2 text-[0.7rem] font-bold">{count}</span>

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

        <span className="absolute bottom-1 text-[0.6rem] font-bold text-white/70">giữ để to 💗</span>
      </motion.button>

      {/* growing preview while charging */}
      <AnimatePresence>
        {charging && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[160] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at center, ${color}22, transparent 60%)` }}
              animate={{ opacity: 0.4 + charge * 0.5 }}
            />
            <motion.span style={{ scale: previewScale }} className="text-7xl drop-shadow-2xl sm:text-8xl">
              {action.emoji}
            </motion.span>
            <motion.div
              className="mt-4 font-display text-lg font-black"
              style={{ color: charge >= 0.85 ? '#fb7185' : '#fff' }}
            >
              {charge >= 0.85 ? 'MEGA 💥 — thả ra!' : charge >= 0.45 ? 'To hơn nữa... 💗' : 'Giữ lâu để to hơn'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
