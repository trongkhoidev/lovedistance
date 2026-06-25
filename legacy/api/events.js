const { getSql, initDb } = require('./_db');

module.exports = async function handler(req, res) {
  try {
    await initDb();
    const db = getSql();
    const roomId = String(req.query.roomId || '').trim().toUpperCase();
    const afterId = Number(req.query.afterId || 0);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    if (!roomId) return res.status(400).json({ error: 'Missing roomId' });

    const rows = afterId > 0
      ? await db`
          SELECT id, room_id, actor_client_id, actor_name, event_type, emoji, message, payload, created_at
          FROM room_events
          WHERE room_id = ${roomId} AND id > ${afterId}
          ORDER BY id ASC
          LIMIT ${limit}
        `
      : await db`
          SELECT id, room_id, actor_client_id, actor_name, event_type, emoji, message, payload, created_at
          FROM room_events
          WHERE room_id = ${roomId}
          ORDER BY id DESC
          LIMIT ${limit}
        `;
    return res.status(200).json({ events: afterId > 0 ? rows : rows.reverse() });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
};
