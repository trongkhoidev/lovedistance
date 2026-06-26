'use client';

import { useEffect, useState } from 'react';
import { isMuted, setMuted } from '@/lib/sounds';

export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setM] = useState(false);
  useEffect(() => setM(isMuted()), []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setM(next);
  }
  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      className={`focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-lg shadow-soft transition-transform active:scale-90 ${className}`}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
