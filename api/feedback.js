const { getSql, initDb } = require('./_db');

module.exports = async function handler(req, res) {
  try {
    await initDb();
    const db = getSql();

    if (req.method === 'GET') {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
      const rows = await db`
        SELECT id, room_id, rating, message, created_at
        FROM feedback
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return res.status(200).json({ feedback: rows });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const roomId = String(body.roomId || '').trim().toUpperCase() || null;
    const rating = body.rating ? Math.max(1, Math.min(5, Number(body.rating))) : null;
    const message = String(body.message || '').trim() || null;
    if (!rating && !message) return res.status(400).json({ error: 'Missing feedback' });

    await db`
      INSERT INTO feedback (room_id, rating, message)
      VALUES (${roomId}, ${rating}, ${message})
    `;
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Server error' });
  }
};
