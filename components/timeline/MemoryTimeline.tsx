'use client';

import { motion } from 'framer-motion';
import { formatDate, formatTime } from '@/lib/format';
import type { RoomEvent } from '@/lib/types';

const MILESTONE_TYPES = new Set(['room.created', 'room.joined', 'pet.levelup', 'streak.milestone', 'shop.buy']);

function dayKey(iso: string): string {
  return formatDate(iso);
}

export function MemoryTimeline({ events }: { events: RoomEvent[] }) {
  const ordered = [...events].reverse(); // newest first
  const groups: { day: string; items: RoomEvent[] }[] = [];
  for (const e of ordered) {
    const day = dayKey(e.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }

  if (!events.length) {
    return <p className="py-10 text-center text-muted">Chưa có kỷ niệm nào — hãy bắt đầu tương tác nhé! 💕</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.day}>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{g.day}</span>
            <span className="h-px flex-1 bg-border/60" />
          </div>
          <div className="relative space-y-3 pl-6">
            <span className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-border/60" />
            {g.items.map((e) => {
              const milestone = MILESTONE_TYPES.has(e.event_type);
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-[1.18rem] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-surface ${
                      milestone ? 'bg-love' : 'bg-primary/60'
                    }`}
                  />
                  <div className={`rounded-2xl p-3 ${milestone ? 'bg-love/10' : 'bg-surface-2/40'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{e.emoji || '•'}</span>
                      <span className="text-sm font-bold">{e.message}</span>
                    </div>
                    <div className="mt-0.5 text-[0.7rem] text-muted">{formatTime(e.created_at)}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
