'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  glyph: string;
}

const SETS: Record<string, string[]> = {
  bubbles: ['🫧', '○', '◌', '•', '🐚', '🌊'],
  hearts: ['💕', '💖', '💙', '🩵', '✨', '🐬'],
  stars: ['✨', '⭐', '🌟', '💫', '🫧']
};

export function ParticleField({ kind = 'bubbles', count = 18, glyphs: custom }: { kind?: string; count?: number; glyphs?: string[] }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const glyphs = custom && custom.length ? custom : SETS[kind] || SETS.bubbles;
    const next: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 12 + Math.random() * 26,
      duration: 9 + Math.random() * 12,
      delay: -Math.random() * 18,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)]
    }));
    setParticles(next);
  }, [kind, count, custom]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 animate-[floatUp_var(--d)_linear_infinite] select-none opacity-70"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            ['--d' as string]: `${p.duration}s`,
            animationDelay: `${p.delay}s`
          }}
        >
          {p.glyph}
        </span>
      ))}
    </div>
  );
}
