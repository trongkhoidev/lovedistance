'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/providers/ToastProvider';
import type { Room } from '@/lib/types';
import type { getPresence } from '@/lib/presence';

interface Props {
  room: Room;
  presence: ReturnType<typeof getPresence>;
  onLeave: () => void;
}

export function CoupleHeader({ room, presence, onLeave }: Props) {
  const toast = useToast();

  function copyCode() {
    navigator.clipboard?.writeText(room.roomId).catch(() => {});
    toast(`📋 Đã copy mã: ${room.roomId}`, 'success');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={presence.myName} self online={presence.me.online} />
          <motion.span
            className="text-love"
            animate={{ scale: presence.bothOnline ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 1, repeat: presence.bothOnline ? Infinity : 0 }}
          >
            {presence.bothOnline ? '💞' : '🤍'}
          </motion.span>
          <Avatar name={presence.partnerName || 'Chưa vào'} online={presence.partner.online} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={copyCode}
            className="focus-ring hidden rounded-pill bg-primary/10 px-3 py-1.5 font-display text-sm font-bold tracking-widest text-primary sm:block"
          >
            {room.roomId}
          </button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={onLeave}>
            Thoát 👋
          </Button>
        </div>
      </div>
    </header>
  );
}

function Avatar({ name, self, online }: { name: string; self?: boolean; online?: boolean }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="relative">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
            self ? 'grad-primary' : 'bg-love'
          }`}
        >
          {self ? '😊' : '🥰'}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
            online ? 'bg-teal' : 'bg-muted/50'
          }`}
        />
      </div>
      <div className="hidden min-w-0 leading-tight sm:block">
        <div className="truncate text-sm font-bold">{name || '...'}</div>
        <div className="text-[0.65rem] text-muted">{self ? 'Bạn' : online ? 'Đang online' : 'Offline'}</div>
      </div>
    </div>
  );
}
