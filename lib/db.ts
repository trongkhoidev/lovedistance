import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { Activity, Room, RoomAction } from './types';
import { DEFAULT_THEME } from './theme';
import { applyDecay, DEFAULT_PET } from './pet';
import { DEFAULT_INVENTORY, normalizeInventory } from './shop';
import { DEFAULT_STREAK, normalizeStreak } from './streak';
import { normalizeSulk } from './sulk';

let sql: NeonQueryFunction<false, false> | null = null;
let initialized = false;

export const DEFAULT_ACTIONS: RoomAction[] = [
  { key: 'hold-hand', label: 'Nắm tay', emoji: '🤝', effect: 'burst', hold: true, message: '{name} đang nắm tay bạn!' },
  { key: 'kiss', label: 'Hôn', emoji: '💋', effect: 'kiss', hold: true, message: '{name} gửi bạn một nụ hôn!' },
  { key: 'hug', label: 'Ôm', emoji: '🤗', effect: 'hug', hold: true, message: '{name} đang ôm bạn!' },
  { key: 'heart', label: 'Bắn tim', emoji: '❤️', effect: 'heart', hold: false, message: '{name} bắn tim cho bạn!' },
  { key: 'miss', label: 'Nhớ lắm', emoji: '🥺', effect: 'soft', hold: false, message: '{name}: Nhớ bạn lắm!' },
  { key: 'angry', label: 'Giận rồi', emoji: '😤', effect: 'shake', hold: false, message: '{name}: Giận rồi đó nghe!' }
];

export const DEFAULT_COUNTS: Record<string, number> = {
  'hold-hand': 0,
  kiss: 0,
  hug: 0,
  heart: 0,
  miss: 0,
  angry: 0
};

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function getSql(): NeonQueryFunction<false, false> {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new ApiError('Missing DATABASE_URL. Add a Neon/Postgres integration in Vercel first.', 503);
  }
  if (!sql) sql = neon(connectionString);
  return sql;
}

export async function initDb(): Promise<void> {
  if (initialized) return;
  const db = getSql();
  await db`
    CREATE TABLE IF NOT EXISTS rooms (
      room_id TEXT PRIMARY KEY,
      creator_name TEXT,
      creator_client_id TEXT,
      creator_joined_at TIMESTAMPTZ,
      creator_last_seen_at TIMESTAMPTZ,
      creator_left_at TIMESTAMPTZ,
      partner_name TEXT,
      partner_client_id TEXT,
      partner_joined_at TIMESTAMPTZ,
      partner_last_seen_at TIMESTAMPTZ,
      partner_left_at TIMESTAMPTZ,
      creator_touch_at TIMESTAMPTZ,
      partner_touch_at TIMESTAMPTZ,
      sulk JSONB NOT NULL DEFAULT '{}'::jsonb,
      counts JSONB NOT NULL DEFAULT '{}'::jsonb,
      total INTEGER NOT NULL DEFAULT 0,
      session_seconds INTEGER NOT NULL DEFAULT 0,
      connected_at TIMESTAMPTZ,
      coins INTEGER NOT NULL DEFAULT 0,
      theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      session_theme_config JSONB,
      session_theme_expires_at TIMESTAMPTZ,
      room_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
      pet_state JSONB NOT NULL DEFAULT '{}'::jsonb,
      inventory JSONB NOT NULL DEFAULT '{}'::jsonb,
      streak JSONB NOT NULL DEFAULT '{}'::jsonb,
      activities JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Backfill columns for previously-created tables (idempotent)
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_touch_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS partner_touch_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS sulk JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS inventory JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS streak JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS theme_config JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS session_theme_config JSONB`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS session_theme_expires_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_actions JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS pet_state JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await db`
    CREATE TABLE IF NOT EXISTS feedback (
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT,
      rating INTEGER,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS room_events (
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL,
      actor_client_id TEXT,
      actor_name TEXT,
      event_type TEXT NOT NULL,
      emoji TEXT,
      message TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_room_events_room_created ON room_events (room_id, created_at DESC)`;
  await db`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      keys JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_push_room ON push_subscriptions (room_id)`;
  initialized = true;
}

interface LogOpts {
  actorClientId?: string | null;
  actorName?: string | null;
  emoji?: string | null;
  payload?: Record<string, unknown>;
}

export async function logEvent(
  db: NeonQueryFunction<false, false>,
  roomId: string,
  eventType: string,
  message: string,
  opts: LogOpts = {}
): Promise<void> {
  await db`
    INSERT INTO room_events (room_id, actor_client_id, actor_name, event_type, emoji, message, payload)
    VALUES (
      ${roomId},
      ${opts.actorClientId || null},
      ${opts.actorName || null},
      ${eventType},
      ${opts.emoji || null},
      ${message},
      ${JSON.stringify(opts.payload || {})}::jsonb
    )
  `;
}

type Row = Record<string, any>;

/** Map a DB row to the normalized Room shape (merging defaults + time decay for display). */
export function normalizeRoom(row: Row | null | undefined, nowMs = Date.now()): Room | null {
  if (!row) return null;
  const actions = Array.isArray(row.room_actions) && row.room_actions.length ? row.room_actions : DEFAULT_ACTIONS;
  const activities = Array.isArray(row.activities) ? (row.activities as Activity[]).slice(0, 12) : [];
  return {
    roomId: row.room_id,
    creatorName: row.creator_name,
    creatorClientId: row.creator_client_id,
    creatorJoinedAt: row.creator_joined_at,
    creatorLastSeenAt: row.creator_last_seen_at,
    creatorLeftAt: row.creator_left_at,
    partnerName: row.partner_name,
    partnerClientId: row.partner_client_id,
    partnerJoinedAt: row.partner_joined_at,
    partnerLastSeenAt: row.partner_last_seen_at,
    partnerLeftAt: row.partner_left_at,
    creatorTouchAt: row.creator_touch_at,
    partnerTouchAt: row.partner_touch_at,
    sulk: normalizeSulk(row.sulk),
    counts: row.counts || {},
    total: row.total || 0,
    sessionSeconds: row.session_seconds || 0,
    connectedAt: row.connected_at,
    coins: row.coins || 0,
    themeConfig: { ...DEFAULT_THEME, ...(row.theme_config || {}) },
    sessionThemeConfig: row.session_theme_config || null,
    sessionThemeExpiresAt: row.session_theme_expires_at,
    actions,
    pet: applyDecay({ ...DEFAULT_PET, ...(row.pet_state || {}) }, nowMs),
    inventory: normalizeInventory(row.inventory),
    streak: normalizeStreak(row.streak),
    activities,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function addActivity(activities: Activity[] | undefined, emoji: string, message: string): Activity[] {
  const next: Activity[] = [
    { emoji, message, createdAt: new Date().toISOString() },
    ...(Array.isArray(activities) ? activities : [])
  ];
  return next.slice(0, 12);
}
