'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 lg:px-6">
        {/* brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl grad-fun text-lg shadow-pop">🌊</span>
          <span className="hidden font-display text-lg font-black grad-text md:block">LoveDistance</span>
        </Link>

        {/* couple */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
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

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="hidden items-center gap-1 rounded-pill bg-sun/15 px-2.5 py-1 text-sm font-black text-sun sm:flex">
            🪙 {room.coins}
          </span>
          <button
            onClick={copyCode}
            className="focus-ring hidden rounded-pill bg-primary/10 px-3 py-1.5 font-display text-sm font-black tracking-widest text-primary sm:block"
          >
            {room.roomId}
          </button>
          <Link href="/ranking" aria-label="Bảng xếp hạng" className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-lg shadow-soft lg:hidden">
            🏆
          </Link>
          <SoundToggle />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={onLeave}>
            <span className="hidden sm:inline">Thoát</span> 👋
          </Button>
        </div>
      </div>
    </header>
  );
}

function Avatar({ name, self, online }: { name: string; self?: boolean; online?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="relative">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-soft ${
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
      <div className="hidden min-w-0 leading-tight lg:block">
        <div className="truncate text-sm font-bold">{name || '...'}</div>
        <div className="text-[0.65rem] text-muted">{self ? 'Bạn' : online ? 'Đang online' : 'Offline'}</div>
      </div>
    </div>
  );
}
