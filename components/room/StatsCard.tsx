'use client';

import { motion } from 'framer-motion';
import { Card, CardTitle } from '@/components/ui/Card';
import type { Room } from '@/lib/types';

const STAT_DEFS: { key: string; label: string }[] = [
  { key: 'kiss', label: 'Nụ hôn 💋' },
  { key: 'hug', label: 'Cái ôm 🤗' },
  { key: 'hold-hand', label: 'Nắm tay 🤝' },
  { key: 'heart', label: 'Bắn tim ❤️' },
  { key: 'miss', label: 'Nhớ nhau 🥺' }
];

export function StatsCard({ room }: { room: Room }) {
  return (
    <Card>
      <CardTitle icon="📊">Thống kê Room</CardTitle>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <motion.div
          layout
          className="col-span-2 rounded-2xl bg-gradient-to-br from-primary/15 to-teal/15 p-3 sm:col-span-3"
        >
          <div className="text-xs font-bold text-muted">Tổng tương tác</div>
          <div className="grad-text font-display text-4xl font-bold">{room.total}</div>
        </motion.div>
        {STAT_DEFS.map((s) => (
          <div key={s.key} className="rounded-2xl bg-surface-2/60 p-3">
            <div className="text-xs font-semibold text-muted">{s.label}</div>
            <div className="text-2xl font-bold">{room.counts[s.key] || 0}</div>
          </div>
        ))}
        <div className="rounded-2xl bg-sun/15 p-3">
          <div className="text-xs font-semibold text-muted">Xu 🪙</div>
          <div className="text-2xl font-bold text-sun">{room.coins}</div>
        </div>
      </div>
    </Card>
  );
}
