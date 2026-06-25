'use client';

import { AnimatePresence, motion } from 'framer-motion';

export interface Incoming {
  id: number;
  emoji: string;
  message: string;
}

export function IncomingPopup({ incoming }: { incoming: Incoming | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[150] flex justify-center px-4 sm:bottom-10">
      <AnimatePresence>
        {incoming && (
          <motion.div
            key={incoming.id}
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="pointer-events-auto flex items-center gap-3 rounded-pill bg-love px-5 py-3 text-white shadow-pop"
          >
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8 }}
            >
              {incoming.emoji}
            </motion.span>
            <span className="font-bold">{incoming.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
