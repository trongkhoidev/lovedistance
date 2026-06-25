import type { ThemeConfig } from './types';

// Room "skins" — decorative accent presets layered on top of the ocean design system.
// Each maps to the legacy ThemeConfig shape (pink/purple/blue) for DB compatibility,
// but values are tuned to stay within the sea palette.
export interface ThemeTemplate {
  id: string;
  name: string;
  emoji: string;
  // accent trio applied as CSS vars on the room
  primary: string; // ocean blue
  teal: string;
  aqua: string;
  love: string;
  particles: string;
  swatch: [string, string, string];
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'ocean',
    name: 'Biển xanh',
    emoji: '🌊',
    primary: '#0ea5e9',
    teal: '#2dd4bf',
    aqua: '#7dd3fc',
    love: '#fb7185',
    particles: 'bubbles',
    swatch: ['#7dd3fc', '#0ea5e9', '#0c4a6e']
  },
  {
    id: 'lagoon',
    name: 'Đầm ngọc',
    emoji: '🏝️',
    primary: '#14b8a6',
    teal: '#5eead4',
    aqua: '#99f6e4',
    love: '#fb7185',
    particles: 'bubbles',
    swatch: ['#99f6e4', '#14b8a6', '#0f766e']
  },
  {
    id: 'coral',
    name: 'San hô',
    emoji: '🪸',
    primary: '#fb7185',
    teal: '#2dd4bf',
    aqua: '#fda4af',
    love: '#f43f5e',
    particles: 'hearts',
    swatch: ['#fecdd3', '#fb7185', '#0ea5e9']
  },
  {
    id: 'sunset-sea',
    name: 'Hoàng hôn biển',
    emoji: '🌅',
    primary: '#fb923c',
    teal: '#38bdf8',
    aqua: '#fdba74',
    love: '#f472b6',
    particles: 'hearts',
    swatch: ['#fdba74', '#fb923c', '#0ea5e9']
  },
  {
    id: 'deep',
    name: 'Biển sâu',
    emoji: '🐳',
    primary: '#6366f1',
    teal: '#22d3ee',
    aqua: '#818cf8',
    love: '#f472b6',
    particles: 'bubbles',
    swatch: ['#a5b4fc', '#6366f1', '#1e1b4b']
  },
  {
    id: 'aurora',
    name: 'Cực quang',
    emoji: '✨',
    primary: '#34d399',
    teal: '#5eead4',
    aqua: '#a7f3d0',
    love: '#f9a8d4',
    particles: 'stars',
    swatch: ['#a7f3d0', '#34d399', '#0c4a6e']
  }
];

export const THEME_MAP: Record<string, ThemeTemplate> = THEME_TEMPLATES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, ThemeTemplate>
);

export const DEFAULT_THEME: ThemeConfig = {
  templateId: 'ocean',
  name: 'Biển xanh',
  bg: '#eef9ff',
  surface: '#ffffff',
  surface2: '#e3f4fb',
  pink: '#fb7185',
  purple: '#0ea5e9',
  blue: '#7dd3fc',
  particles: 'bubbles'
};

export function templateToConfig(t: ThemeTemplate): ThemeConfig {
  return {
    templateId: t.id,
    name: t.name,
    bg: '#eef9ff',
    surface: '#ffffff',
    surface2: '#e3f4fb',
    pink: t.love,
    purple: t.primary,
    blue: t.aqua,
    particles: t.particles
  };
}

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Build CSS custom-prop overrides for a room theme (accent only). */
export function themeCssVars(cfg: ThemeConfig | null | undefined): Record<string, string> {
  if (!cfg) return {};
  const tpl = THEME_MAP[cfg.templateId];
  const primary = tpl?.primary ?? cfg.purple ?? DEFAULT_THEME.purple;
  const teal = tpl?.teal ?? DEFAULT_THEME.blue;
  const aqua = tpl?.aqua ?? cfg.blue ?? DEFAULT_THEME.blue;
  const love = tpl?.love ?? cfg.pink ?? DEFAULT_THEME.pink;
  return {
    '--c-primary': hexToRgbTriplet(primary),
    '--c-teal': hexToRgbTriplet(teal),
    '--c-aqua': hexToRgbTriplet(aqua),
    '--c-love': hexToRgbTriplet(love)
  };
}
