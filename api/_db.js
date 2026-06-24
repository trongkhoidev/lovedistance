const { neon } = require('@neondatabase/serverless');

let sql;
let initialized;

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
  await db`
    CREATE TABLE IF NOT EXISTS feedback (
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT,
      rating INTEGER,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
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
    activities: Array.isArray(row.activities) ? row.activities.slice(0, 8) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = { getSql, initDb, normalizeRoom };
