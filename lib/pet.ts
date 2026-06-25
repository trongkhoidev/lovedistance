import type { Pet, PetActionKey, PetStatKey, PetType } from './types';

export const PET_TYPES: { type: PetType; label: string; emoji: string; tint: string }[] = [
  { type: 'seal', label: 'Hải cẩu', emoji: '🦭', tint: '#bfe7f5' },
  { type: 'whale', label: 'Cá voi', emoji: '🐳', tint: '#9cd3f0' },
  { type: 'fish', label: 'Cá', emoji: '🐠', tint: '#ffd6a5' },
  { type: 'octopus', label: 'Bạch tuộc', emoji: '🐙', tint: '#ffb3c6' },
  { type: 'penguin', label: 'Chim cánh cụt', emoji: '🐧', tint: '#cfe8ff' },
  { type: 'turtle', label: 'Rùa', emoji: '🐢', tint: '#b7e4c7' }
];

export const PET_EMOJI: Record<PetType, string> = {
  seal: '🦭',
  whale: '🐳',
  fish: '🐠',
  octopus: '🐙',
  penguin: '🐧',
  turtle: '🐢'
};

export const DEFAULT_PET: Pet = {
  name: 'Sương',
  type: 'seal',
  level: 1,
  xp: 0,
  mood: 'curious',
  fullness: 70,
  hydration: 70,
  cleanliness: 70,
  energy: 80,
  happiness: 75,
  affection: 20,
  lastTickAt: null,
  lastActionAt: null
};

export const STAT_META: Record<PetStatKey, { label: string; emoji: string; color: string }> = {
  fullness: { label: 'Độ no', emoji: '🍙', color: '#f59e0b' },
  hydration: { label: 'Độ khát', emoji: '💧', color: '#38bdf8' },
  cleanliness: { label: 'Vệ sinh', emoji: '🫧', color: '#2dd4bf' },
  energy: { label: 'Năng lượng', emoji: '⚡', color: '#a78bfa' },
  happiness: { label: 'Hạnh phúc', emoji: '💖', color: '#fb7185' }
};

// Decay per hour (points lost). Higher = decays faster.
const DECAY_PER_HOUR: Record<PetStatKey, number> = {
  fullness: 4,
  hydration: 5,
  cleanliness: 2.5,
  energy: 3,
  happiness: 3
};

const STAT_KEYS: PetStatKey[] = ['fullness', 'hydration', 'cleanliness', 'energy', 'happiness'];

function clamp(n: number, min = 0, max = 100): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 45)) + 1);
}

export function xpForLevel(level: number): number {
  // inverse of levelFromXp — xp needed to reach `level`
  const l = Math.max(1, level) - 1;
  return Math.ceil(l * l * 45);
}

export function xpProgress(pet: Pet): { current: number; needed: number; ratio: number } {
  const cur = xpForLevel(pet.level);
  const next = xpForLevel(pet.level + 1);
  const into = pet.xp - cur;
  const span = Math.max(1, next - cur);
  return { current: Math.max(0, into), needed: span, ratio: clamp((into / span) * 100) / 100 };
}

/** Merge stored (possibly legacy) pet data with defaults. */
export function normalizePet(raw: Partial<Pet> | null | undefined): Pet {
  const pet = { ...DEFAULT_PET, ...(raw || {}) } as Pet;
  for (const k of STAT_KEYS) pet[k] = clamp(Number(pet[k] ?? DEFAULT_PET[k]));
  pet.affection = clamp(Number(pet.affection ?? 20));
  pet.xp = Math.max(0, Math.floor(Number(pet.xp) || 0));
  pet.level = levelFromXp(pet.xp);
  if (!PET_EMOJI[pet.type]) pet.type = 'seal';
  return pet;
}

/** Apply time-based decay since lastTickAt. Returns a new pet object. */
export function applyDecay(raw: Partial<Pet> | null | undefined, nowMs: number): Pet {
  const pet = normalizePet(raw);
  const last = pet.lastTickAt ? new Date(pet.lastTickAt).getTime() : nowMs;
  const hours = Math.max(0, (nowMs - last) / 3_600_000);
  if (hours <= 0) {
    pet.lastTickAt = new Date(nowMs).toISOString();
    return pet;
  }
  for (const k of STAT_KEYS) {
    if (k === 'happiness') continue;
    pet[k] = clamp(pet[k] - DECAY_PER_HOUR[k] * hours);
  }
  // happiness also drops faster when other needs are neglected
  const neglect = STAT_KEYS.filter((k) => k !== 'happiness' && pet[k] < 30).length;
  pet.happiness = clamp(pet.happiness - (DECAY_PER_HOUR.happiness + neglect * 1.5) * hours);
  pet.lastTickAt = new Date(nowMs).toISOString();
  pet.mood = deriveMood(pet);
  return pet;
}

export function deriveMood(pet: Pet): string {
  if (pet.energy < 20) return 'sleepy';
  if (pet.fullness < 25) return 'hungry';
  if (pet.hydration < 25) return 'thirsty';
  if (pet.cleanliness < 25) return 'messy';
  if (pet.happiness > 80) return 'joyful';
  if (pet.happiness < 35) return 'sad';
  return 'content';
}

export const MOOD_LABEL: Record<string, string> = {
  curious: 'tò mò',
  sleepy: 'buồn ngủ',
  hungry: 'đói bụng',
  thirsty: 'khát nước',
  messy: 'lấm lem',
  joyful: 'hớn hở',
  sad: 'buồn xo',
  content: 'vui vẻ',
  excited: 'phấn khích',
  loved: 'được yêu'
};

export interface PetActionDef {
  key: PetActionKey;
  label: string;
  emoji: string;
  xp: number;
  coins: number;
  effects: Partial<Record<PetStatKey, number>>;
  mood: string;
  toast: string;
}

export const PET_ACTIONS: PetActionDef[] = [
  { key: 'feed', label: 'Cho ăn', emoji: '🍙', xp: 6, coins: 2, effects: { fullness: 30, happiness: 4 }, mood: 'content', toast: 'đã ăn no nê' },
  { key: 'drink', label: 'Cho uống', emoji: '💧', xp: 4, coins: 1, effects: { hydration: 35 }, mood: 'content', toast: 'đã uống nước mát' },
  { key: 'walk', label: 'Đi dạo', emoji: '🚶', xp: 8, coins: 3, effects: { happiness: 20, energy: -10, hydration: -5 }, mood: 'joyful', toast: 'đi dạo vui ghê' },
  { key: 'bath', label: 'Tắm', emoji: '🛁', xp: 6, coins: 2, effects: { cleanliness: 45, happiness: 5 }, mood: 'content', toast: 'sạch thơm tho' },
  { key: 'sleep', label: 'Đi ngủ', emoji: '😴', xp: 3, coins: 1, effects: { energy: 50, happiness: 3 }, mood: 'sleepy', toast: 'ngủ một giấc ngon' },
  { key: 'play', label: 'Chơi đùa', emoji: '🎾', xp: 9, coins: 3, effects: { happiness: 25, energy: -12, fullness: -5 }, mood: 'excited', toast: 'chơi đùa thích mê' },
  { key: 'pet', label: 'Vuốt ve', emoji: '🤲', xp: 5, coins: 1, effects: { happiness: 12, affection: 4 } as Partial<Record<PetStatKey, number>>, mood: 'loved', toast: 'được vuốt ve hạnh phúc' }
];

export const PET_ACTION_MAP: Record<PetActionKey, PetActionDef> = PET_ACTIONS.reduce(
  (acc, a) => {
    acc[a.key] = a;
    return acc;
  },
  {} as Record<PetActionKey, PetActionDef>
);

export interface CareResult {
  pet: Pet;
  xpGain: number;
  coinGain: number;
  leveledUp: boolean;
  newLevel: number;
}

const ANTI_SPAM_MS = 3500;

/** Apply a care action to the (already decayed) pet. */
export function carePet(raw: Partial<Pet>, action: PetActionKey, nowMs: number): CareResult {
  const def = PET_ACTION_MAP[action];
  const pet = applyDecay(raw, nowMs);
  const prevLevel = pet.level;

  const last = pet.lastActionAt ? new Date(pet.lastActionAt).getTime() : 0;
  const antiSpam = last && nowMs - last < ANTI_SPAM_MS ? 0.4 : 1;

  if (def) {
    for (const [k, v] of Object.entries(def.effects)) {
      const key = k as keyof Pet;
      pet[key] = clamp((pet[key] as number) + (v as number)) as never;
    }
    const xpGain = Math.round(def.xp * antiSpam);
    const coinGain = Math.round(def.coins * antiSpam);
    pet.xp = Math.max(0, pet.xp + xpGain);
    pet.level = levelFromXp(pet.xp);
    pet.mood = pet.level > prevLevel ? 'excited' : def.mood;
    pet.lastActionAt = new Date(nowMs).toISOString();
    pet.affection = clamp(pet.affection + Math.max(1, Math.round(xpGain / 3)));
    return { pet, xpGain, coinGain, leveledUp: pet.level > prevLevel, newLevel: pet.level };
  }

  return { pet, xpGain: 0, coinGain: 0, leveledUp: false, newLevel: pet.level };
}

export const PET_NAME_MAX = 18;
