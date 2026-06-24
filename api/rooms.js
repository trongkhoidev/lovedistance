const { getSql, initDb, normalizeRoom } = require('./_db');

const DEFAULT_COUNTS = {
  'hold-hand': 0,
  kiss: 0,
  hug: 0,
  heart: 0,
  miss: 0,
  angry: 0
};

function send(res, status, body) {
  res.status(status).json(body);
}

function addActivity(activities, emoji, message) {
  const next = [
    { emoji, message, createdAt: new Date().toISOString() },
    ...(Array.isArray(activities) ? activities : [])
  ];
  return next.slice(0, 8);
}

module.exports = async function handler(req, res) {
  try {
    await initDb();
    const db = getSql();

    if (req.method === 'GET') {
      const roomId = String(req.query.roomId || '').trim().toUpperCase();
      if (!roomId) return send(res, 400, { error: 'Missing roomId' });
      const rows = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      return send(res, rows[0] ? 200 : 404, rows[0] ? { room: normalizeRoom(rows[0]) } : { error: 'Room not found' });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

    const body = req.body || {};
    const type = String(body.type || '');
    const roomId = String(body.roomId || '').trim().toUpperCase();
    if (!roomId) return send(res, 400, { error: 'Missing roomId' });

    if (type === 'create') {
      const name = String(body.name || '').trim();
      const clientId = String(body.clientId || '').trim();
      if (!name) return send(res, 400, { error: 'Missing name' });
      if (!clientId) return send(res, 400, { error: 'Missing clientId' });

      const rows = await db`
        INSERT INTO rooms (room_id, creator_name, creator_client_id, counts, activities)
        VALUES (${roomId}, ${name}, ${clientId}, ${JSON.stringify(DEFAULT_COUNTS)}::jsonb, ${JSON.stringify(addActivity([], '🎉', name + ' đã tạo room'))}::jsonb)
        ON CONFLICT (room_id) DO UPDATE SET
          creator_name = COALESCE(rooms.creator_name, EXCLUDED.creator_name),
          creator_client_id = COALESCE(rooms.creator_client_id, EXCLUDED.creator_client_id),
          updated_at = NOW()
        RETURNING *
      `;
      return send(res, 200, { room: normalizeRoom(rows[0]) });
    }

    if (type === 'join') {
      const name = String(body.name || '').trim();
      const clientId = String(body.clientId || '').trim();
      if (!name) return send(res, 400, { error: 'Missing name' });
      if (!clientId) return send(res, 400, { error: 'Missing clientId' });

      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return send(res, 404, { error: 'Room không tồn tại' });

      const current = existing[0];
      if (current.creator_client_id === clientId) return send(res, 200, { room: normalizeRoom(current) });
      if (current.partner_client_id && current.partner_client_id !== clientId) {
        return send(res, 409, { error: 'Room này đã đủ 2 người rồi' });
      }
      const activities = addActivity(current.activities, '💞', name + ' đã vào room');
      const rows = await db`
        UPDATE rooms
        SET partner_name = ${name},
            partner_client_id = ${clientId},
            connected_at = COALESCE(connected_at, NOW()),
            activities = ${JSON.stringify(activities)}::jsonb,
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      return send(res, 200, { room: normalizeRoom(rows[0]) });
    }

    if (type === 'action') {
      const key = String(body.key || '');
      const emoji = String(body.emoji || '💕');
      const message = String(body.message || 'Có tương tác mới');
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return send(res, 404, { error: 'Room không tồn tại' });

      const rows = await db`
        UPDATE rooms
        SET counts = jsonb_set(
              COALESCE(counts, '{}'::jsonb),
              ARRAY[${key}::text],
              to_jsonb(COALESCE((counts->>${key})::integer, 0) + 1),
              true
            ),
            total = total + 1,
            activities = jsonb_build_array(
              jsonb_build_object(
                'emoji', ${emoji}::text,
                'message', ${message}::text,
                'createdAt', ${new Date().toISOString()}::text
              )
            ) || COALESCE(activities, '[]'::jsonb),
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      return send(res, 200, { room: normalizeRoom(rows[0]) });
    }

    if (type === 'session') {
      const seconds = Math.max(0, Number(body.seconds || 0));
      const rows = await db`
        UPDATE rooms
        SET session_seconds = GREATEST(session_seconds, ${seconds}),
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      return send(res, rows[0] ? 200 : 404, rows[0] ? { room: normalizeRoom(rows[0]) } : { error: 'Room không tồn tại' });
    }

    return send(res, 400, { error: 'Unknown action type' });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.message || 'Server error' });
  }
};
