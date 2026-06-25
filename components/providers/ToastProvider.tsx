'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'warn' | 'error';
}
interface ToastCtx {
  toast: (message: string, tone?: Toast['tone']) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`pointer-events-auto max-w-sm rounded-pill px-4 py-2.5 text-sm font-bold shadow-soft backdrop-blur-md ${toneClass(
                t.tone
              )}`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

function toneClass(tone: Toast['tone']): string {
  switch (tone) {
    case 'success':
      return 'bg-teal/90 text-white';
    case 'warn':
      return 'bg-sun/90 text-deep';
    case 'error':
      return 'bg-love/90 text-white';
    default:
      return 'bg-surface/90 text-text border border-border/70';
  }
}

export const useToast = () => useContext(Ctx).toast;
