'use client';

import { THEME_TEMPLATES, templateToConfig } from '@/lib/theme';
import type { ThemeConfig } from '@/lib/types';

export function ThemePicker({ current, onSelect }: { current: string; onSelect: (cfg: ThemeConfig) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {THEME_TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(templateToConfig(t))}
          className={`focus-ring flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-colors ${
            current === t.id ? 'border-primary' : 'border-border/50 hover:border-primary/40'
          }`}
        >
          <span
            className="h-8 w-full rounded-lg"
            style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]}, ${t.swatch[2]})` }}
          />
          <span className="text-[0.7rem] font-bold">
            {t.emoji} {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
