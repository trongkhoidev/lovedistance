'use client';

import { motion } from 'framer-motion';
import { StatGauge } from '@/components/aquarium/StatGauge';
import { MOOD_LABEL, STAT_META, isSick, petStage, wellbeing, xpProgress } from '@/lib/pet';
import { badgeForCount } from '@/lib/streak';
import type { PetStatKey, Room } from '@/lib/types';

const ORDER: PetStatKey[] = ['fullness', 'hydration', 'cleanliness', 'energy', 'happiness'];

export function PetStatsPanel({ room }: { room: Room }) {
  const { pet, streak, coins } = room;
  const xp = xpProgress(pet);
  const badge = badgeForCount(streak.count);
  const stage = petStage(pet.level);
  const wb = wellbeing(pet);
  const sick = isSick(pet);
  const wbColor = wb >= 70 ? '#2dd4bf' : wb >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="space-y-4">
      {/* wellbeing + stage */}
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2/60 p-3">
        <WellbeingRing value={wb} color={wbColor} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-display font-black text-text">
            {stage.emoji} {stage.label}
            <span className="rounded-pill bg-primary/10 px-2 text-xs font-bold text-primary">Lv.{pet.level}</span>
          </div>
          <div className="text-xs text-muted">
            Sức khỏe {wb}/100 · tâm trạng {MOOD_LABEL[pet.mood] || pet.mood}
          </div>
        </div>
      </div>

      {sick && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-500">
          🤒 {pet.name} đang ốm — hãy chăm sóc các chỉ số thấp để bé khỏe lại nhé!
        </div>
      )}

      {/* level + streak + coins */}
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Chuỗi ngày" value={`${streak.count} ${badge.emoji}`} accent="text-love" sub={badge.label} />
        <Tile label="Thân thiết" value={`${pet.affection}%`} accent="text-grape" sub="tình cảm" />
        <Tile label="Xu" value={`${coins} 🪙`} accent="text-sun" sub="của cả hai" />
      </div>

      {/* xp bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-muted">
          <span>EXP tới Lv.{pet.level + 1}</span>
          <span>
            {xp.current}/{xp.needed}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-pill bg-surface-2">
          <motion.div
            className="grad-primary h-full rounded-pill"
            initial={false}
            animate={{ width: `${Math.round(xp.ratio * 100)}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          />
        </div>
      </div>

      {/* stats */}
      <div className="space-y-2.5">
        {ORDER.map((k) => (
          <StatGauge key={k} label={STAT_META[k].label} emoji={STAT_META[k].emoji} value={pet[k]} color={STAT_META[k].color} />
        ))}
      </div>
    </div>
  );
}

function WellbeingRing({ value, color }: { value: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgb(var(--c-surface-2))" strokeWidth="6" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDasharray: `${(value / 100) * circ} ${circ}` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <span className="font-display text-sm font-black" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-surface-2/60 p-2.5 text-center">
      <div className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className={`font-display text-lg font-bold ${accent}`}>{value}</div>
      {sub && <div className="truncate text-[0.65rem] text-muted">{sub}</div>}
    </div>
  );
}
