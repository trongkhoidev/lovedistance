'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { playSound, startCharge, stopCharge, type SoundName } from '@/lib/sounds';
import type { RoomAction } from '@/lib/types';
import { EmojiPicker } from './EmojiPicker';

const CHARGE_FULL_MS = 1800;
const COMBO_WINDOW = 1600;

const SOUND_BY_KEY: Record<string, SoundName> = { kiss: 'kiss', hug: 'hug', heart: 'heart', miss: 'miss', angry: 'angry' };
const COLOR_BY_KEY: Record<string, string> = {
  kiss: '#fb7185', hug: '#f59e0b', heart: '#f43f5e', miss: '#38bdf8', angry: '#a855f7', 'hold-hand': '#2dd4bf'
};
const FALLBACK = ['#0ea5e9', '#8b5cf6', '#fb7185', '#14b8a6', '#f59e0b'];

function customAction(emoji: string): RoomAction {
  return { key: 'custom', emoji, label: 'Cảm xúc', effect: 'burst', hold: false, message: `{name} gửi ${emoji}` };
}

interface Props {
  actions: RoomAction[]; // emotions excluding hold-hand
  onSend: (action: RoomAction, level: number, note?: string) => void;
}

export function EmotionComposer({ actions, onSend }: Props) {
  const [selected, setSelected] = useState<RoomAction>(actions[0] || customAction('❤️'));
  const [note, setNote] = useState('');
  const [showPicker, setShowPicker] = useState(false);
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

  const color = COLOR_BY_KEY[selected.key] || FALLBACK[0];
  const isCustom = selected.key === 'custom';

  function pick(a: RoomAction) {
    setSelected(a);
    navigator.vibrate?.(15);
  }

  function tick() {
    const pct = Math.min(1, (Date.now() - startAt.current) / CHARGE_FULL_MS);
    setCharge(pct);
    if (pct < 1) raf.current = requestAnimationFrame(tick);
  }
  function startHold() {
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
    const pct = Math.min(1, (Date.now() - startAt.current) / CHARGE_FULL_MS);
    setCharging(false);
    setCharge(0);
    const level = pct >= 0.85 ? 3 : pct >= 0.45 ? 2 : 1;

    const now = Date.now();
    const nextCombo = now - lastSent.current < COMBO_WINDOW ? combo + 1 : 1;
    lastSent.current = now;
    setCombo(nextCombo);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), COMBO_WINDOW);

    playSound(SOUND_BY_KEY[selected.key] || 'send', nextCombo);
    if (level === 3) playSound('mega');
    navigator.vibrate?.(level === 3 ? [40, 30, 80] : 30);

    onSend(selected, level, note.trim() || undefined);
    setNote('');
  }

  const previewScale = 0.6 + charge * 2.2;

  return (
    <div className="relative">
      {/* emotion chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {actions.map((a) => {
          const on = !isCustom && selected.key === a.key;
          const c = COLOR_BY_KEY[a.key] || FALLBACK[0];
          return (
            <button
              key={a.key}
              onClick={() => pick(a)}
              className={`focus-ring flex items-center gap-1.5 rounded-pill border px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                on ? 'border-transparent text-white shadow-pop' : 'border-border bg-surface-2 text-text'
              }`}
              style={on ? { background: `linear-gradient(160deg, ${c}, ${c}cc)` } : undefined}
            >
              <span className="text-lg">{a.emoji}</span>
              {a.label}
            </button>
          );
        })}
        {/* custom selected chip */}
        {isCustom && (
          <span className="flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-bold text-white shadow-pop" style={{ background: 'linear-gradient(160deg,#8b5cf6,#6d28d9)' }}>
            <span className="text-lg">{selected.emoji}</span> Tự chọn
          </span>
        )}
        <button
          onClick={() => setShowPicker((s) => !s)}
          className="focus-ring flex items-center gap-1 rounded-pill border border-dashed border-grape/50 px-3 py-2 text-sm font-bold text-grape transition-colors hover:bg-grape/10 active:scale-95"
        >
          ➕ emoji
        </button>
      </div>

      {/* picker */}
      <AnimatePresence>
        {showPicker && (
          <EmojiPicker
            onPick={(e) => {
              setSelected(customAction(e));
              setShowPicker(false);
              navigator.vibrate?.(15);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* send bar */}
      <div className="flex items-center gap-2 rounded-3xl border border-border/70 bg-surface-2/60 p-1.5">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl text-white shadow-pop"
          style={{ background: `linear-gradient(160deg, ${color}, ${color}cc)` }}
        >
          {selected.emoji}
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder="Nhắn gì đó cho người ấy... (tuỳ chọn)"
          className="min-w-0 flex-1 bg-transparent px-1 text-sm font-medium outline-none placeholder:text-muted"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              playSound(SOUND_BY_KEY[selected.key] || 'send');
              onSend(selected, 1, note.trim() || undefined);
              setNote('');
            }
          }}
        />
        <button
          onPointerDown={startHold}
          onPointerUp={release}
          onPointerLeave={() => charging && release()}
          onPointerCancel={release}
          className="focus-ring relative grid h-12 shrink-0 place-items-center rounded-2xl grad-fun px-5 font-display font-black text-white shadow-pop active:scale-95"
        >
          {charging ? (
            <span className="text-sm">{charge >= 0.85 ? 'MEGA 💥' : 'Giữ...'}</span>
          ) : (
            <span>Gửi 💝</span>
          )}
          <AnimatePresence>
            {combo >= 2 && (
              <motion.span
                key={combo}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -right-1 -top-2 rounded-full bg-sun px-1.5 text-xs font-black text-deep shadow"
              >
                x{combo}🔥
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <p className="mt-2 text-center text-[0.72rem] text-muted">
        Chạm cảm xúc → nhắn 1 dòng → <b>Gửi</b> · giữ nút Gửi để hiệu ứng to dần 💗
      </p>

      {/* growing preview while charging */}
      <AnimatePresence>
        {charging && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[160] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${color}22, transparent 60%)` }} animate={{ opacity: 0.4 + charge * 0.5 }} />
            <motion.span style={{ scale: previewScale }} className="text-7xl drop-shadow-2xl sm:text-8xl">
              {selected.emoji}
            </motion.span>
            <div className="mt-4 font-display text-lg font-black" style={{ color: charge >= 0.85 ? '#fb7185' : '#fff' }}>
              {charge >= 0.85 ? 'MEGA 💥 — thả ra!' : charge >= 0.45 ? 'To hơn nữa... 💗' : 'Giữ lâu để to hơn'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
