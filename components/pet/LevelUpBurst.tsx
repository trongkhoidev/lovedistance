'use client';

import { AnimatePresence, motion } from 'framer-motion';

export function LevelUpBurst({ level }: { level: number | null }) {
  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          key={level}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[160] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.5, y: 20 }}
            animate={{ scale: [0.5, 1.15, 1], y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-2 rounded-card bg-surface/90 px-8 py-6 shadow-pop backdrop-blur-md"
          >
            <span className="text-5xl">🎉</span>
            <span className="font-display text-2xl font-bold grad-text">Lên Lv.{level}!</span>
            <span className="text-sm text-muted">Thú cưng của hai bạn lớn hơn rồi 💙</span>
          </motion.div>
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl"
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                rotate: Math.random() * 360
              }}
              transition={{ duration: 1.2 }}
            >
              {['✨', '⭐', '💙', '🎊', '🐬'][i % 5]}
            </motion.span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
