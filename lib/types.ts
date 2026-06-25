// ===== Core domain types shared between client and server =====

export type PetStatKey = 'fullness' | 'hydration' | 'cleanliness' | 'energy' | 'happiness';

export type PetActionKey = 'feed' | 'drink' | 'walk' | 'bath' | 'sleep' | 'play' | 'pet';

export type PetType = 'seal' | 'whale' | 'fish' | 'octopus' | 'penguin' | 'turtle';

export interface PetEquipped {
  hat: string | null;
  outfit: string | null;
  scene: string | null;
}

export interface Pet {
  name: string;
  type: PetType;
  level: number;
  xp: number;
  mood: string;
  // 0-100, higher is better
  fullness: number;
  hydration: number;
  cleanliness: number;
  energy: number;
  happiness: number;
  affection: number;
  lastTickAt: string | null;
  lastActionAt: string | null;
}

export interface Inventory {
  owned: string[];
  equipped: PetEquipped;
}

export interface Streak {
  count: number;
  best: number;
  lastCareDate: string | null; // YYYY-MM-DD
}

export interface RoomAction {
  key: string;
  label: string;
  emoji: string;
  effect: string;
  hold: boolean;
  message: string;
}

export interface ThemeConfig {
  templateId: string;
  name: string;
  bg: string;
  surface: string;
  surface2: string;
  pink: string;
  purple: string;
  blue: string;
  particles: string;
  background?: RoomBackground | null;
}

export interface RoomBackground {
  type: 'image' | 'video';
  url: string;
  contentType: string;
  size: number;
  loop?: boolean;
  muted?: boolean;
}

export interface Room {
  roomId: string;
  creatorName: string | null;
  creatorClientId: string | null;
  creatorJoinedAt: string | null;
  creatorLastSeenAt: string | null;
  creatorLeftAt: string | null;
  partnerName: string | null;
  partnerClientId: string | null;
  partnerJoinedAt: string | null;
  partnerLastSeenAt: string | null;
  partnerLeftAt: string | null;
  creatorTouchAt: string | null;
  partnerTouchAt: string | null;
  counts: Record<string, number>;
  total: number;
  sessionSeconds: number;
  connectedAt: string | null;
  coins: number;
  themeConfig: ThemeConfig;
  sessionThemeConfig: ThemeConfig | null;
  sessionThemeExpiresAt: string | null;
  actions: RoomAction[];
  pet: Pet;
  inventory: Inventory;
  streak: Streak;
  activities: Activity[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Activity {
  emoji: string;
  message: string;
  createdAt: string;
}

export interface RoomEvent {
  id: number;
  room_id: string;
  actor_client_id: string | null;
  actor_name: string | null;
  event_type: string;
  emoji: string | null;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export type RankMetric = 'interactions' | 'petLevel';
export type RankPeriod = 'week' | 'month' | 'all';

export interface RankRow {
  roomId: string;
  coupleName: string;
  petName: string;
  petType: PetType;
  petLevel: number;
  value: number; // interactions count or pet level depending on metric
}

// ===== Shop =====
export type ShopCategory = 'food' | 'toy' | 'hat' | 'outfit' | 'scene';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  emoji: string;
  price: number;
  description: string;
  unlockLevel?: number;
  // consumables apply a pet effect when bought+used; cosmetics are equippable
  cosmetic?: boolean;
}
