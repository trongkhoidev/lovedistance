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
      partner_name TEXT,
      counts JSONB NOT NULL DEFAULT '{}'::jsonb,
      total INTEGER NOT NULL DEFAULT 0,
      session_seconds INTEGER NOT NULL DEFAULT 0,
      activities JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
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
    partnerName: row.partner_name,
    counts: row.counts || {},
    total: row.total || 0,
    sessionSeconds: row.session_seconds || 0,
    activities: row.activities || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = { getSql, initDb, normalizeRoom };
