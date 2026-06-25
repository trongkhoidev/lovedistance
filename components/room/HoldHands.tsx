'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Props {
  partnerName: string;
  partnerTouching: boolean;
  partnerOnline: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}

export function HoldHands({ partnerName, partnerTouching, partnerOnline, onHoldStart, onHoldEnd }: Props) {
  const [holding, setHolding] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const connected = holding && partnerTouching;
  const wasConnected = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // celebrate the moment both hands meet
  useEffect(() => {
    if (connected && !wasConnected.current) {
      navigator.vibrate?.([60, 40, 60, 40, 120]);
    }
    wasConnected.current = connected;
  }, [connected]);

  // count how long they've been connected
  useEffect(() => {
    if (connected) {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      setSeconds(0);
      if (timer.current) clearInterval(timer.current);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [connected]);

  function start() {
    if (holding) return;
    setHolding(true);
    onHoldStart();
  }
  function end() {
    if (!holding) return;
    setHolding(false);
    onHoldEnd();
  }

  const status = connected
    ? `Đang nắm tay nhau 💞  ${seconds > 0 ? `· ${seconds}s` : ''}`
    : holding
      ? `Đang đợi ${partnerName || 'người ấy'} nắm lại...`
      : partnerTouching
        ? `${partnerName || 'Người ấy'} đang chờ bạn nắm tay! 🫶`
        : 'Giữ để nắm tay';

  return (
    <div className="relative overflow-hidden rounded-card border border-border/60 bg-gradient-to-br from-primary/10 to-love/10 p-4">
      {/* ripples when connected */}
      <AnimatePresence>
        {connected &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-love/50"
              initial={{ scale: 0.4, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>

      <div className="relative flex flex-col items-center gap-3">
        <button
          onPointerDown={start}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          className="focus-ring relative flex h-32 w-32 select-none items-center justify-center rounded-full text-5xl shadow-pop transition-transform active:scale-95"
          style={{
            background: connected
              ? 'linear-gradient(160deg, #fb7185, #f43f5e)'
              : holding
                ? 'linear-gradient(160deg, #38bdf8, #0ea5e9)'
                : 'linear-gradient(160deg, rgb(var(--c-primary)), rgb(var(--c-teal)))'
          }}
        >
          {/* heartbeat */}
          <motion.span
            animate={connected ? { scale: [1, 1.35, 1, 1.25, 1] } : holding ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: connected ? 0.9 : 1.4, repeat: Infinity }}
            className="drop-shadow-lg"
          >
            {connected ? '🤝' : holding ? '✋' : '🫱'}
          </motion.span>

          {/* glossy highlight */}
          <span className="pointer-events-none absolute inset-x-4 top-3 h-5 rounded-full bg-white/40 blur-[2px]" />
        </button>

        <div className="text-center">
          <div className={`font-display font-bold ${connected ? 'text-love' : 'text-text'}`}>{status}</div>
          {!partnerOnline && !holding && (
            <div className="text-xs text-muted">{partnerName || 'Người ấy'} chưa online — cứ nắm, người ấy sẽ thấy khi vào 💗</div>
          )}
        </div>
      </div>
    </div>
  );
}
