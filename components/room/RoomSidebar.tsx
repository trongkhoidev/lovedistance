'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PET_EMOJI, xpProgress } from '@/lib/pet';
import type { Room } from '@/lib/types';
import type { getPresence } from '@/lib/presence';

export interface NavItem {
  value: string;
  label: string;
  icon: string;
}

interface Props {
  items: NavItem[];
  tab: string;
  setTab: (v: string) => void;
  room: Room;
  presence: ReturnType<typeof getPresence>;
  className?: string;
}

export function RoomSidebar({ items, tab, setTab, room, presence, className = '' }: Props) {
  const xp = xpProgress(room.pet);
  return (
    <aside className={`lg:sticky lg:top-[5.25rem] lg:h-[calc(100dvh-6.5rem)] ${className}`}>
      <div className="flex h-full flex-col gap-3">
        {/* couple + pet mini status */}
        <div className="card card-hover p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{PET_EMOJI[room.pet.type] || '🦭'}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-black text-text">{room.pet.name}</div>
              <div className="text-[0.7rem] text-muted">Lv.{room.pet.level} · cùng nuôi</div>
            </div>
            <span className="rounded-pill bg-sun/15 px-2 py-0.5 text-xs font-black text-sun">🪙 {room.coins}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-pill bg-surface-2">
            <div className="h-full rounded-pill grad-fun" style={{ width: `${Math.round(xp.ratio * 100)}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[0.7rem] font-bold">
            <span className="truncate text-primary">😊 {presence.myName || 'Bạn'}</span>
            <span className="text-love">💞</span>
            <span className="truncate text-grape">{presence.partnerName || 'Chưa vào'} 🥰</span>
          </div>
        </div>

        {/* nav */}
        <nav className="card flex flex-col gap-1 p-2">
          {items.map((it) => {
            const active = tab === it.value;
            return (
              <button
                key={it.value}
                onClick={() => setTab(it.value)}
                className="focus-ring relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-colors"
              >
                {active && <motion.span layoutId="side-active" className="absolute inset-0 rounded-2xl grad-fun shadow-pop" />}
                <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-xl text-lg ${active ? 'bg-white/20' : 'bg-surface-2'}`}>
                  {it.icon}
                </span>
                <span className={`relative z-10 ${active ? 'text-white' : 'text-text'}`}>{it.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ranking */}
        <Link
          href="/ranking"
          className="focus-ring card card-hover mt-auto flex items-center gap-3 p-3 text-sm font-bold text-text"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sun/20 text-lg">🏆</span>
          Bảng xếp hạng
          <span className="ml-auto text-muted">›</span>
        </Link>
      </div>
    </aside>
  );
}
