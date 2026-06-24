const { neon } = require('@neondatabase/serverless');

let sql;
let initialized;

const DEFAULT_THEME = {
  templateId: 'night-sky',
  name: 'Night Sky',
  bg: '#0f0617',
  surface: '#1a0d2e',
  surface2: '#241240',
  pink: '#ff5fa0',
  purple: '#c47cff',
  blue: '#6ec6ff',
  particles: 'hearts'
};

const DEFAULT_ACTIONS = [
  { key: 'hold-hand', label: 'Nắm tay', emoji: '🤝', effect: 'burst', hold: true, message: '{name} đang nắm tay bạn!' },
  { key: 'kiss', label: 'Hôn', emoji: '💋', effect: 'kiss', hold: true, message: '{name} gửi bạn một nụ hôn!' },
  { key: 'hug', label: 'Ôm', emoji: '🤗', effect: 'hug', hold: true, message: '{name} đang ôm bạn!' },
  { key: 'heart', label: 'Bắn tim', emoji: '❤️', effect: 'heart', hold: false, message: '{name} bắn tim cho bạn!' },
  { key: 'miss', label: 'Nhớ lắm', emoji: '🥺', effect: 'soft', hold: false, message: '{name}: Nhớ bạn lắm!' },
  { key: 'angry', label: 'Giận rồi', emoji: '😤', effect: 'shake', hold: false, message: '{name}: Giận rồi đó nghe!' }
];

const DEFAULT_PET = {
  name: 'Mochi',
  type: 'heartbun',
  level: 1,
  xp: 0,
  mood: 'curious',
  energy: 80,
  hunger: 40,
  affection: 20,
  lastActionAt: null
};

function getSql() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    const err = new Error('Missing DATABASE_URL. Add a Neon/Postgres integration in Vercel first.');
    err.statusCode = 503;
    throw err;
  }
  if (!sql) sql = neon(connectionString);
  return sql;
}

async function initDb() {
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
      counts JSONB NOT NULL DEFAULT '{}'::jsonb,
      total INTEGER NOT NULL DEFAULT 0,
      session_seconds INTEGER NOT NULL DEFAULT 0,
      connected_at TIMESTAMPTZ,
      theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      session_theme_config JSONB,
      session_theme_expires_at TIMESTAMPTZ,
      room_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
      pet_state JSONB NOT NULL DEFAULT '{}'::jsonb,
      activities JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_client_id TEXT`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS partner_client_id TEXT`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_joined_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_last_seen_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_left_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS partner_joined_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS partner_last_seen_at TIMESTAMPTZ`;
  await db`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS partner_left_at TIMESTAMPTZ`;
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
  initialized = true;
}

function normalizeRoom(row) {
  if (!row) return null;
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
    counts: row.counts || {},
    total: row.total || 0,
    sessionSeconds: row.session_seconds || 0,
    connectedAt: row.connected_at,
    themeConfig: { ...DEFAULT_THEME, ...(row.theme_config || {}) },
    sessionThemeConfig: row.session_theme_config || null,
    sessionThemeExpiresAt: row.session_theme_expires_at,
    actions: Array.isArray(row.room_actions) && row.room_actions.length ? row.room_actions : DEFAULT_ACTIONS,
    pet: { ...DEFAULT_PET, ...(row.pet_state || {}) },
    activities: Array.isArray(row.activities) ? row.activities.slice(0, 8) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = { getSql, initDb, normalizeRoom, DEFAULT_THEME, DEFAULT_ACTIONS, DEFAULT_PET };
