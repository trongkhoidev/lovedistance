'use client';

import { motion } from 'framer-motion';
import { StatGauge } from '@/components/aquarium/StatGauge';
import { MOOD_LABEL, STAT_META, xpProgress } from '@/lib/pet';
import { badgeForCount } from '@/lib/streak';
import type { PetStatKey, Room } from '@/lib/types';

const ORDER: PetStatKey[] = ['fullness', 'hydration', 'cleanliness', 'energy', 'happiness'];

export function PetStatsPanel({ room }: { room: Room }) {
  const { pet, streak, coins } = room;
  const xp = xpProgress(pet);
  const badge = badgeForCount(streak.count);

  return (
    <div className="space-y-4">
      {/* level + streak + coins */}
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Cấp độ" value={`Lv.${pet.level}`} accent="text-primary" sub={`${MOOD_LABEL[pet.mood] || pet.mood}`} />
        <Tile label="Chuỗi ngày" value={`${streak.count} ${badge.emoji}`} accent="text-love" sub={badge.label} />
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

function Tile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-surface-2/60 p-2.5 text-center">
      <div className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className={`font-display text-lg font-bold ${accent}`}>{value}</div>
      {sub && <div className="truncate text-[0.65rem] text-muted">{sub}</div>}
    </div>
  );
}
