'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import type { RoomAction } from '@/lib/types';

export function CustomActions({ actions, onSave }: { actions: RoomAction[]; onSave: (a: RoomAction[]) => void }) {
  const toast = useToast();
  const [emoji, setEmoji] = useState('');
  const [label, setLabel] = useState('');

  function add() {
    if (!label.trim()) return toast('Nhập tên hành động trước nhé', 'warn');
    if (actions.length >= 9) return toast('Tối đa 9 hành động', 'warn');
    const next: RoomAction = {
      key: `custom-${Date.now().toString(36)}`,
      label: label.trim().slice(0, 18),
      emoji: emoji.trim() || '💕',
      effect: 'burst',
      hold: false,
      message: `{name} gửi ${emoji.trim() || '💕'}`
    };
    onSave([...actions, next]);
    setEmoji('');
    setLabel('');
    toast('Đã thêm hành động ✨', 'success');
  }

  function remove(key: string) {
    if (actions.length <= 1) return toast('Phải giữ lại ít nhất 1 hành động chứ!', 'warn');
    onSave(actions.filter((a) => a.key !== key));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {actions.map((a) => (
            <motion.span
              key={a.key}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 rounded-pill bg-surface-2/70 py-1 pl-3 pr-1.5 text-sm font-semibold"
            >
              <span>{a.emoji}</span>
              <span>{a.label}</span>
              <button
                onClick={() => remove(a.key)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-love/20 text-xs text-love hover:bg-love/40"
              >
                ✕
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
          placeholder="🎁"
          className="w-14 rounded-2xl border border-border bg-surface-2/60 px-2 py-2.5 text-center text-lg outline-none focus:border-primary"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={18}
          placeholder="Tặng quà"
          className="flex-1 rounded-2xl border border-border bg-surface-2/60 px-3 py-2.5 font-semibold outline-none focus:border-primary"
        />
        <Button variant="soft" onClick={add}>
          Thêm
        </Button>
      </div>
    </div>
  );
}
