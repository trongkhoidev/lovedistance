const { getSql, initDb, normalizeRoom, DEFAULT_THEME, DEFAULT_ACTIONS, DEFAULT_PET } = require('./_db');

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

async function logEvent(db, roomId, eventType, message, opts = {}) {
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function cleanAction(action, index) {
  const label = String(action.label || '').trim().slice(0, 18) || 'Yêu thương';
  const emoji = String(action.emoji || '💕').trim().slice(0, 8) || '💕';
  const key = String(action.key || label.toLowerCase().replace(/\s+/g, '-')).replace(/[^a-z0-9-]/gi, '').slice(0, 32) || `custom-${index}`;
  return {
    key,
    label,
    emoji,
    effect: String(action.effect || 'burst').slice(0, 20),
    hold: !!action.hold,
    message: String(action.message || '{name} gửi ' + emoji).slice(0, 80)
  };
}

function evolvePet(current, xpGain, patch = {}) {
  const pet = { ...DEFAULT_PET, ...(current || {}) };
  const now = Date.now();
  const lastAction = pet.lastActionAt ? new Date(pet.lastActionAt).getTime() : 0;
  const antiSpam = lastAction && now - lastAction < 3500 ? 0.35 : 1;
  const xp = Math.max(0, Math.floor((pet.xp || 0) + xpGain * antiSpam));
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 45)) + 1);
  const mood = level > pet.level ? 'excited' : (xpGain > 0 ? 'happy' : pet.mood || 'curious');
  return {
    ...pet,
    ...patch,
    xp,
    level,
    mood,
    hunger: clamp((pet.hunger || 40) + (xpGain > 0 ? 1 : 0) - (patch.hungerDrop || 0), 0, 100),
    energy: clamp((pet.energy || 80) - (xpGain > 0 ? 1 : 0) + (patch.energyBoost || 0), 0, 100),
    affection: clamp((pet.affection || 20) + Math.max(1, Math.round(xpGain / 3)), 0, 100),
    lastActionAt: new Date(now).toISOString()
  };
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
        INSERT INTO rooms (room_id, creator_name, creator_client_id, creator_joined_at, creator_last_seen_at, creator_left_at, counts, room_actions, theme_config, pet_state, activities)
        VALUES (${roomId}, ${name}, ${clientId}, NOW(), NOW(), NULL, ${JSON.stringify(DEFAULT_COUNTS)}::jsonb, ${JSON.stringify(DEFAULT_ACTIONS)}::jsonb, ${JSON.stringify(DEFAULT_THEME)}::jsonb, ${JSON.stringify(DEFAULT_PET)}::jsonb, ${JSON.stringify(addActivity([], '🎉', name + ' đã tạo room'))}::jsonb)
        ON CONFLICT (room_id) DO UPDATE SET
          creator_name = COALESCE(rooms.creator_name, EXCLUDED.creator_name),
          creator_client_id = COALESCE(rooms.creator_client_id, EXCLUDED.creator_client_id),
          creator_joined_at = COALESCE(rooms.creator_joined_at, NOW()),
          creator_last_seen_at = NOW(),
          creator_left_at = NULL,
          updated_at = NOW()
        RETURNING *
      `;
      await logEvent(db, roomId, 'room.created', `${name} vào web và tạo room`, { actorClientId: clientId, actorName: name, emoji: '🎉' });
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
            partner_joined_at = COALESCE(partner_joined_at, NOW()),
            partner_last_seen_at = NOW(),
            partner_left_at = NULL,
            connected_at = COALESCE(connected_at, NOW()),
            activities = ${JSON.stringify(activities)}::jsonb,
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      await logEvent(db, roomId, 'room.joined', `${name} vào room`, { actorClientId: clientId, actorName: name, emoji: '💞' });
      return send(res, 200, { room: normalizeRoom(rows[0]) });
    }

    if (type === 'action') {
      const key = String(body.key || '');
      const emoji = String(body.emoji || '💕');
      const message = String(body.message || 'Có tương tác mới');
      const actorName = String(body.actorName || '').trim() || 'Ai đó';
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return send(res, 404, { error: 'Room không tồn tại' });
      const pet = evolvePet(existing[0].pet_state, 6);

      const rows = await db`
        UPDATE rooms
        SET counts = jsonb_set(
              COALESCE(counts, '{}'::jsonb),
              ARRAY[${key}::text],
              to_jsonb(COALESCE((counts->>${key})::integer, 0) + 1),
              true
            ),
            total = total + 1,
            pet_state = ${JSON.stringify(pet)}::jsonb,
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
      await logEvent(db, roomId, 'action.sent', message, { actorName, emoji, payload: { key } });
      return send(res, 200, { room: normalizeRoom(rows[0]) });
    }

    if (type === 'theme') {
      const theme = { ...DEFAULT_THEME, ...(body.themeConfig || {}) };
      const persist = body.persist !== false;
      const rows = persist ? await db`
        UPDATE rooms
        SET theme_config = ${JSON.stringify(theme)}::jsonb,
            session_theme_config = NULL,
            session_theme_expires_at = NULL,
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      ` : await db`
        UPDATE rooms
        SET session_theme_config = ${JSON.stringify(theme)}::jsonb,
            session_theme_expires_at = NOW() + INTERVAL '8 hours',
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      await logEvent(db, roomId, 'theme.changed', `Đã đổi giao diện room thành ${theme.name || theme.templateId}`, { emoji: '🎨', payload: { templateId: theme.templateId, persist } });
      return send(res, rows[0] ? 200 : 404, rows[0] ? { room: normalizeRoom(rows[0]) } : { error: 'Room không tồn tại' });
    }

    if (type === 'actions') {
      const actions = (Array.isArray(body.actions) ? body.actions : DEFAULT_ACTIONS).slice(0, 9).map(cleanAction);
      const rows = await db`
        UPDATE rooms
        SET room_actions = ${JSON.stringify(actions)}::jsonb,
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      await logEvent(db, roomId, 'custom_action.saved', 'Đã cập nhật bộ hành động của room', { emoji: '✨', payload: { count: actions.length } });
      return send(res, rows[0] ? 200 : 404, rows[0] ? { room: normalizeRoom(rows[0]) } : { error: 'Room không tồn tại' });
    }

    if (type === 'pet') {
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return send(res, 404, { error: 'Room không tồn tại' });
      const action = String(body.petAction || '');
      const patch = {};
      let xpGain = 0;
      if (body.name) patch.name = String(body.name).trim().slice(0, 18);
      if (body.petType) patch.type = String(body.petType).trim().slice(0, 18);
      if (action === 'feed') { xpGain = 4; patch.hungerDrop = 18; patch.energyBoost = 4; patch.mood = 'full'; }
      if (action === 'play') { xpGain = 7; patch.energyBoost = -5; patch.mood = 'playful'; }
      if (action === 'pet') { xpGain = 5; patch.mood = 'loved'; }
      const pet = evolvePet(existing[0].pet_state, xpGain, patch);
      delete pet.hungerDrop;
      delete pet.energyBoost;
      const rows = await db`
        UPDATE rooms
        SET pet_state = ${JSON.stringify(pet)}::jsonb,
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      const petLabel = action === 'feed' ? 'cho pet ăn' : action === 'play' ? 'chơi với pet' : action === 'pet' ? 'vuốt ve pet' : 'cập nhật pet';
      await logEvent(db, roomId, 'pet.action', petLabel, { emoji: '🐾', payload: { petAction: action, petName: pet.name } });
      return send(res, 200, { room: normalizeRoom(rows[0]) });
    }

    if (type === 'heartbeat' || type === 'leave') {
      const clientId = String(body.clientId || '').trim();
      if (!clientId) return send(res, 400, { error: 'Missing clientId' });

      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return send(res, 404, { error: 'Room không tồn tại' });
      const current = existing[0];
      const isLeaving = type === 'leave';
      let rows;
      if (current.creator_client_id === clientId) {
        rows = await db`
          UPDATE rooms
          SET creator_last_seen_at = NOW(),
              creator_left_at = ${isLeaving ? new Date().toISOString() : null},
              updated_at = NOW()
          WHERE room_id = ${roomId}
          RETURNING *
        `;
      } else if (current.partner_client_id === clientId) {
        rows = await db`
          UPDATE rooms
          SET partner_last_seen_at = NOW(),
              partner_left_at = ${isLeaving ? new Date().toISOString() : null},
              updated_at = NOW()
          WHERE room_id = ${roomId}
          RETURNING *
        `;
      } else {
        return send(res, 403, { error: 'Bạn không thuộc room này' });
      }
      if (isLeaving) {
        const name = current.creator_client_id === clientId ? current.creator_name : current.partner_name;
        await logEvent(db, roomId, 'room.left', `${name || 'Ai đó'} rời room`, { actorClientId: clientId, actorName: name, emoji: '👋' });
      }
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
