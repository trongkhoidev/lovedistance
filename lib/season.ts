export interface Season {
  id: string;
  name: string;
  emoji: string;
  greeting: string;
  glyphs: string[]; // particle glyphs
  accent: { primary: string; teal: string; aqua: string; love: string };
  coinBonus: number; // bonus coins per care action during season
}

const SEASONS: Season[] = [
  {
    id: 'tet',
    name: 'Tết Nguyên Đán',
    emoji: '🧧',
    greeting: 'Chúc hai bạn năm mới an khang — lì xì cho bé cưng nào!',
    glyphs: ['🧧', '🎴', '🌸', '🍊', '✨', '🐉'],
    accent: { primary: '#ef4444', teal: '#f59e0b', aqua: '#fca5a5', love: '#dc2626' },
    coinBonus: 3
  },
  {
    id: 'valentine',
    name: 'Valentine',
    emoji: '💝',
    greeting: 'Mùa của tình yêu — gửi thật nhiều cảm xúc cho nhau nhé!',
    glyphs: ['💝', '💗', '💕', '🌹', '💘', '🩷'],
    accent: { primary: '#ec4899', teal: '#f472b6', aqua: '#f9a8d4', love: '#e11d48' },
    coinBonus: 2
  },
  {
    id: 'midautumn',
    name: 'Trung Thu',
    emoji: '🏮',
    greeting: 'Trung thu đoàn viên — cùng ngắm trăng với bé cưng!',
    glyphs: ['🏮', '🌕', '🥮', '🐰', '✨', '🎑'],
    accent: { primary: '#f59e0b', teal: '#fbbf24', aqua: '#fcd34d', love: '#fb7185' },
    coinBonus: 2
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    greeting: 'Boo! Mùa ma quái dễ thương đã tới 👻',
    glyphs: ['🎃', '👻', '🦇', '🕸️', '🍬', '🌙'],
    accent: { primary: '#f97316', teal: '#a855f7', aqua: '#fdba74', love: '#7c3aed' },
    coinBonus: 2
  },
  {
    id: 'christmas',
    name: 'Giáng Sinh',
    emoji: '🎄',
    greeting: 'Giáng sinh an lành — tặng quà cho bé cưng nhé!',
    glyphs: ['🎄', '🎁', '❄️', '⛄', '✨', '🔔'],
    accent: { primary: '#ef4444', teal: '#22c55e', aqua: '#fca5a5', love: '#16a34a' },
    coinBonus: 3
  },
  {
    id: 'summer',
    name: 'Mùa hè biển xanh',
    emoji: '🏖️',
    greeting: 'Mùa hè rực nắng — tắm biển cùng bé cưng thôi!',
    glyphs: ['🏖️', '🌊', '🐚', '🐬', '☀️', '🍉'],
    accent: { primary: '#0ea5e9', teal: '#06b6d4', aqua: '#7dd3fc', love: '#fb7185' },
    coinBonus: 1
  }
];

const SEASON_MAP = Object.fromEntries(SEASONS.map((s) => [s.id, s]));

/** Active season from a date (month/day windows; lunar dates approximated). */
export function activeSeason(date = new Date()): Season | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const md = m * 100 + d;

  if (md >= 125 && md <= 205) return SEASON_MAP.tet; // ~ Tết (approx)
  if (md >= 210 && md <= 215) return SEASON_MAP.valentine;
  if (md >= 909 && md <= 920) return SEASON_MAP.midautumn; // approx
  if (md >= 1025 && md <= 1101) return SEASON_MAP.halloween;
  if (md >= 1218 && md <= 1227) return SEASON_MAP.christmas;
  if (m >= 6 && m <= 8) return SEASON_MAP.summer;
  return null;
}
