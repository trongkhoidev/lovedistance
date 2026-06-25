'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { canBuy, SHOP_ITEMS } from '@/lib/shop';
import type { Room, ShopCategory } from '@/lib/types';

interface Props {
  room: Room;
  onBuy: (itemId: string) => void;
  onEquip: (slot: 'hat' | 'outfit' | 'scene', itemId: string | null) => void;
}

const CATS: { value: ShopCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Tất cả', icon: '🛒' },
  { value: 'food', label: 'Đồ ăn', icon: '🍙' },
  { value: 'toy', label: 'Đồ chơi', icon: '🎾' },
  { value: 'hat', label: 'Mũ', icon: '🎩' },
  { value: 'outfit', label: 'Trang phục', icon: '🧣' },
  { value: 'scene', label: 'Bối cảnh', icon: '🪸' }
];

const SLOT_OF: Record<string, 'hat' | 'outfit' | 'scene'> = { hat: 'hat', outfit: 'outfit', scene: 'scene' };

export function Shop({ room, onBuy, onEquip }: Props) {
  const [cat, setCat] = useState<ShopCategory | 'all'>('all');
  const items = SHOP_ITEMS.filter((i) => cat === 'all' || i.category === cat);
  const { pet, coins, inventory } = room;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">🛍️ Cửa hàng</h3>
        <span className="rounded-pill bg-sun/15 px-3 py-1 font-bold text-sun">{coins} 🪙</span>
      </div>

      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <div className="min-w-[34rem]">
          <SegmentedTabs
            options={CATS}
            value={cat}
            onChange={(v) => setCat(v as ShopCategory | 'all')}
            size="sm"
            layoutId="shop-cats"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((item) => {
          const owned = inventory.owned.includes(item.id);
          const slot = SLOT_OF[item.category];
          const equipped = slot && inventory.equipped[slot] === item.id;
          const check = canBuy(item, pet, coins);
          return (
            <motion.div
              key={item.id}
              layout
              className="flex flex-col rounded-2xl border border-border/60 bg-surface-2/50 p-3 text-center"
            >
              <div className="text-3xl">{item.emoji}</div>
              <div className="mt-1 text-sm font-bold leading-tight">{item.name}</div>
              <div className="mb-2 mt-0.5 line-clamp-2 text-[0.7rem] text-muted">{item.description}</div>

              {item.cosmetic && owned ? (
                <Button
                  variant={equipped ? 'soft' : 'primary'}
                  size="sm"
                  fullWidth
                  onClick={() => onEquip(slot, equipped ? null : item.id)}
                >
                  {equipped ? 'Đang mặc ✓' : 'Trang bị'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={!check.ok}
                  onClick={() => onBuy(item.id)}
                >
                  {check.ok ? `${item.price} 🪙` : check.reason}
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
