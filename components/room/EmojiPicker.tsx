'use client';

import { motion } from 'framer-motion';

const GROUPS: { name: string; emojis: string[] }[] = [
  { name: 'Tình cảm', emojis: ['❤️', '🥰', '😍', '😘', '💋', '🤗', '💕', '💖', '💗', '💓', '💞', '💘', '🩷', '💝', '🌹', '🫶'] },
  { name: 'Vui vẻ', emojis: ['😆', '😄', '🤩', '😝', '😜', '🥳', '😎', '🤭', '✨', '🌟', '⭐', '🎉', '🎈', '🍀', '🌈', '☀️'] },
  { name: 'Nhõng nhẽo', emojis: ['🥺', '😢', '😭', '🥹', '😔', '😴', '🫠', '😣', '🙈', '😶‍🌫️', '💔', '🥀', '🌧️', '☔', '🫂', '🙏'] },
  { name: 'Nghịch', emojis: ['😈', '😏', '😤', '😡', '💢', '👻', '🤪', '😋', '😹', '🐶', '🐱', '🦭', '🍔', '🍕', '🍩', '🧋'] }
];

export function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className="absolute bottom-full left-0 right-0 z-30 mb-2 max-h-72 overflow-y-auto rounded-card border border-border/70 bg-surface p-3 shadow-pop"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-sm font-black text-text">Chọn biểu tượng</span>
        <button onClick={onClose} className="focus-ring rounded-full px-2 text-muted hover:text-text">
          ✕
        </button>
      </div>
      {GROUPS.map((g) => (
        <div key={g.name} className="mb-2">
          <div className="mb-1 text-[0.7rem] font-bold text-muted">{g.name}</div>
          <div className="grid grid-cols-8 gap-1">
            {g.emojis.map((e, i) => (
              <button
                key={`${g.name}-${i}`}
                onClick={() => onPick(e)}
                className="focus-ring grid h-9 place-items-center rounded-xl text-xl transition-colors hover:bg-surface-2 active:scale-90"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
