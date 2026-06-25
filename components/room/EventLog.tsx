'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatTime } from '@/lib/format';
import type { RoomEvent } from '@/lib/types';

export function EventLog({ events, compact }: { events: RoomEvent[]; compact?: boolean }) {
  const ordered = [...events].reverse();
  return (
    <Card className="flex h-full flex-col">
      <CardTitle icon="📜">Nhật ký Room</CardTitle>
      <div className={`no-scrollbar flex-1 space-y-2 overflow-y-auto ${compact ? 'max-h-72' : ''}`}>
        {ordered.length === 0 && <p className="py-6 text-center text-sm text-muted">Chưa có hoạt động nào...</p>}
        <AnimatePresence initial={false}>
          {ordered.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-xl bg-surface-2/40 px-3 py-2"
            >
              <span className="text-lg leading-none">{e.emoji || '•'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.message}</p>
                <p className="text-[0.7rem] text-muted">{formatTime(e.created_at)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
