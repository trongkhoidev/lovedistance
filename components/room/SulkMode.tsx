'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SULK_MAP, SULK_REASONS } from '@/lib/sulk';
import type { SulkState } from '@/lib/types';

/* ============ Modal: start sulking ============ */
export function SulkStartModal({ onConfirm, onClose }: { onConfirm: (reasons: string[], hint: string) => void; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [hint, setHint] = useState('');

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-card bg-surface p-5 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-black text-text">Giận dỗi 😤</h3>
        <p className="mb-3 mt-1 text-sm text-muted">
          Chọn lý do (bí mật) khiến bạn giận. Người ấy sẽ bị <b>khóa toàn bộ</b> và phải đoán đúng để làm hòa.
        </p>
        <div className="mb-3 grid grid-cols-1 gap-2">
          {SULK_REASONS.map((r) => {
            const on = picked.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggle(r.id)}
                className={`focus-ring flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-bold transition-colors ${
                  on ? 'border-love bg-love/10 text-love' : 'border-border bg-surface-2 text-text'
                }`}
              >
                <span className="text-lg">{r.emoji}</span>
                {r.label}
                {on && <span className="ml-auto">✓</span>}
              </button>
            );
          })}
        </div>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          maxLength={120}
          placeholder="Gợi ý nhỏ cho người ấy (tuỳ chọn)..."
          className="mb-4 w-full rounded-2xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={onClose}>
            Thôi bỏ qua
          </Button>
          <Button variant="danger" fullWidth disabled={!picked.length} onClick={() => onConfirm(picked, hint)}>
            Bắt đầu giận 😤
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ============ Banner: the sulker's view ============ */
export function SulkBanner({ sulk, onForgive }: { sulk: SulkState; onForgive: () => void }) {
  const wrong = sulk.guesses.filter((g) => !g.correct).length;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-3 rounded-card border-2 border-love/40 bg-love/10 p-4">
      <div className="flex items-center gap-2">
        <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-2xl">
          😤
        </motion.span>
        <div className="flex-1">
          <div className="font-display font-black text-love">Bạn đang giận</div>
          <div className="text-xs text-muted">Người ấy bị khóa và đang đoán lý do · đã đoán sai {wrong} lần</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {sulk.reasons.map((id) => (
          <span key={id} className="rounded-pill bg-surface px-2 py-0.5 text-xs font-bold text-text">
            {SULK_MAP[id]?.emoji} {SULK_MAP[id]?.label}
          </span>
        ))}
      </div>
      <Button variant="primary" fullWidth className="mt-3" onClick={onForgive}>
        Thôi, tha thứ rồi 💗
      </Button>
    </motion.div>
  );
}

/* ============ Full lock screen: the guesser ============ */
export function SulkLockScreen({
  sulk,
  onGuess,
  onApologize,
  lastWrong
}: {
  sulk: SulkState;
  onGuess: (id: string) => void;
  onApologize: () => void;
  lastWrong: number | null;
}) {
  const triedIds = useMemo(() => new Set(sulk.guesses.map((g) => g.text)), [sulk.guesses]);
  const wrong = sulk.guesses.filter((g) => !g.correct).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[120] flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #3b0a0a 0%, #7f1d1d 50%, #450a0a 100%)' }}
    >
      {/* warning stripes */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-3"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0 12px, #111 12px 24px)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24 0 12px, #111 12px 24px)' }}
      />

      <motion.div
        key={lastWrong ?? 'idle'}
        animate={lastWrong ? { x: [0, -12, 12, -8, 8, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-10 text-center text-white"
      >
        <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-7xl">
          😤
        </motion.div>
        <div className="mt-2 rounded-pill bg-yellow-400 px-3 py-1 text-sm font-black text-red-900">⚠️ NGUY HIỂM · ĐANG BỊ GIẬN</div>
        <h2 className="mt-3 font-display text-2xl font-black">{sulk.byName || 'Người ấy'} đang giận bạn!</h2>
        <p className="mt-1 text-sm text-white/80">
          Mọi chức năng đã bị khóa. Hãy đoán đúng lý do để làm hòa 💔
        </p>

        <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
          <span className="rounded-pill bg-white/15 px-2 py-0.5">Có {sulk.reasonCount} lý do</span>
          <span className="rounded-pill bg-white/15 px-2 py-0.5">Đoán sai: {wrong}</span>
        </div>
        {sulk.hint && (
          <div className="mt-3 rounded-2xl bg-white/10 px-4 py-2 text-sm italic text-yellow-200">💡 Gợi ý: “{sulk.hint}”</div>
        )}

        <AnimatePresence>
          {lastWrong && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 font-display text-lg font-black text-yellow-300"
            >
              Sai rồi, đoán lại đi! 😤
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 grid w-full grid-cols-1 gap-2">
          {SULK_REASONS.map((r) => {
            const tried = triedIds.has(r.id);
            return (
              <button
                key={r.id}
                disabled={tried}
                onClick={() => onGuess(r.id)}
                className={`focus-ring flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-bold transition-all ${
                  tried
                    ? 'border-white/10 bg-white/5 text-white/30 line-through'
                    : 'border-white/30 bg-white/10 text-white hover:bg-white/20 active:scale-95'
                }`}
              >
                <span className="text-lg">{r.emoji}</span>
                {r.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onApologize}
          className="focus-ring mt-4 rounded-pill bg-love px-5 py-2.5 font-bold text-white shadow-pop active:scale-95"
        >
          🥺 Gửi lời xin lỗi
        </button>
        <p className="mt-3 text-xs text-white/50">Hoặc chờ {sulk.byName || 'người ấy'} nguôi giận và tha thứ 💗</p>
      </motion.div>
    </motion.div>
  );
}
