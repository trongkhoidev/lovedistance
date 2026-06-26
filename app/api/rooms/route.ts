import { NextResponse } from 'next/server';
import {
  ApiError,
  DEFAULT_ACTIONS,
  DEFAULT_COUNTS,
  addActivity,
  getSql,
  initDb,
  logEvent,
  normalizeRoom
} from '@/lib/db';
import { DEFAULT_THEME } from '@/lib/theme';
import { DEFAULT_PET, PET_ACTION_MAP, carePet, normalizePet, type PetActionDef } from '@/lib/pet';
import { canBuy, FOOD_EFFECTS, normalizeInventory, SHOP_MAP } from '@/lib/shop';
import { bumpStreak, normalizeStreak } from '@/lib/streak';
import { pushToRoom } from '@/lib/push';
import { activeSeason } from '@/lib/season';
import { normalizeSulk, redactRoomSulk } from '@/lib/sulk';
import type { PetActionKey, RoomAction, SulkState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function cleanAction(action: Partial<RoomAction>, index: number): RoomAction {
  const label = String(action.label || '').trim().slice(0, 18) || 'Yêu thương';
  const emoji = String(action.emoji || '💕').trim().slice(0, 8) || '💕';
  const key =
    String(action.key || label.toLowerCase().replace(/\s+/g, '-'))
      .replace(/[^a-z0-9-]/gi, '')
      .slice(0, 32) || `custom-${index}`;
  return {
    key,
    label,
    emoji,
    effect: String(action.effect || 'burst').slice(0, 20),
    hold: !!action.hold,
    message: String(action.message || `{name} gửi ${emoji}`).slice(0, 80)
  };
}

export async function GET(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const params = new URL(req.url).searchParams;
    const roomId = String(params.get('roomId') || '').trim().toUpperCase();
    const clientId = String(params.get('clientId') || '').trim() || null;
    if (!roomId) return fail('Missing roomId');
    const rows = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
    if (!rows[0]) return fail('Room not found', 404);
    return ok({ room: redactRoomSulk(normalizeRoom(rows[0])!, clientId) });
  } catch (error) {
    const e = error as ApiError;
    return fail(e.message || 'Server error', e.statusCode || 500);
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const type = String(body.type || '');
    const roomId = String(body.roomId || '').trim().toUpperCase();
    if (!roomId) return fail('Missing roomId');

    // ---- create ----
    if (type === 'create') {
      const name = String(body.name || '').trim();
      const clientId = String(body.clientId || '').trim();
      if (!name) return fail('Missing name');
      if (!clientId) return fail('Missing clientId');
      const pet = { ...DEFAULT_PET, lastTickAt: new Date().toISOString() };
      const rows = await db`
        INSERT INTO rooms (room_id, creator_name, creator_client_id, creator_joined_at, creator_last_seen_at, creator_left_at, counts, room_actions, theme_config, pet_state, activities)
        VALUES (${roomId}, ${name}, ${clientId}, NOW(), NOW(), NULL, ${JSON.stringify(DEFAULT_COUNTS)}::jsonb, ${JSON.stringify(DEFAULT_ACTIONS)}::jsonb, ${JSON.stringify(DEFAULT_THEME)}::jsonb, ${JSON.stringify(pet)}::jsonb, ${JSON.stringify(addActivity([], '🎉', `${name} đã tạo room`))}::jsonb)
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
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- join ----
    if (type === 'join') {
      const name = String(body.name || '').trim();
      const clientId = String(body.clientId || '').trim();
      if (!name) return fail('Missing name');
      if (!clientId) return fail('Missing clientId');
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return fail('Room không tồn tại', 404);
      const current = existing[0];
      if (current.creator_client_id === clientId) return ok({ room: normalizeRoom(current) });
      if (current.partner_client_id && current.partner_client_id !== clientId) {
        return fail('Room này đã đủ 2 người rồi', 409);
      }
      const activities = addActivity(current.activities, '💞', `${name} đã vào room`);
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
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- emotion action ----
    if (type === 'action') {
      const key = String(body.key || '');
      const emoji = String(body.emoji || '💕');
      const actorName = String(body.actorName || '').trim() || 'Ai đó';
      const actorClientId = String(body.clientId || '').trim() || null;
      const note = String(body.note || '').trim().slice(0, 120);
      const message = note ? `${actorName}: ${note}` : String(body.message || 'Có tương tác mới');
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return fail('Room không tồn tại', 404);
      // interacting cheers the pet a little
      const pet = normalizePet(existing[0].pet_state);
      pet.happiness = clamp(pet.happiness + 3, 0, 100);
      pet.xp = Math.max(0, pet.xp + 3);
      const rows = await db`
        UPDATE rooms
        SET counts = jsonb_set(
              COALESCE(counts, '{}'::jsonb),
              ARRAY[${key}::text],
              to_jsonb(COALESCE((counts->>${key})::integer, 0) + 1),
              true
            ),
            total = total + 1,
            coins = coins + 1,
            pet_state = ${JSON.stringify(pet)}::jsonb,
            activities = jsonb_build_array(
              jsonb_build_object('emoji', ${emoji}::text, 'message', ${message}::text, 'createdAt', ${new Date().toISOString()}::text)
            ) || COALESCE(activities, '[]'::jsonb),
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      const level = Math.max(1, Math.min(3, Number(body.level) || 1));
      await logEvent(db, roomId, 'action.sent', message, { actorClientId, actorName, emoji, payload: { key, level, note } });
      await pushToRoom(db, roomId, actorClientId, { title: `${actorName} ${emoji}`, body: message, url: `/room/${roomId}`, tag: 'action' });
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- pet: care / rename / equip ----
    if (type === 'pet') {
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return fail('Room không tồn tại', 404);
      const current = existing[0];
      const now = Date.now();
      const actorName = String(body.actorName || '').trim() || 'Ai đó';
      const actorClientId = String(body.clientId || '').trim() || null;

      // equip cosmetic
      if (body.equip && typeof body.equip === 'object') {
        const slot = String(body.equip.slot || '');
        const itemId = body.equip.itemId ? String(body.equip.itemId) : null;
        if (!['hat', 'outfit', 'scene'].includes(slot)) return fail('Slot không hợp lệ');
        const inv = normalizeInventory(current.inventory);
        if (itemId && !inv.owned.includes(itemId)) return fail('Bạn chưa sở hữu vật phẩm này');
        (inv.equipped as unknown as Record<string, string | null>)[slot] = itemId;
        const rows = await db`
          UPDATE rooms SET inventory = ${JSON.stringify(inv)}::jsonb, updated_at = NOW()
          WHERE room_id = ${roomId} RETURNING *
        `;
        return ok({ room: normalizeRoom(rows[0]) });
      }

      // rename / change type (no action)
      const action = String(body.petAction || '') as PetActionKey | '';
      if (!action) {
        const pet = normalizePet(current.pet_state);
        if (body.name) pet.name = String(body.name).trim().slice(0, 18) || pet.name;
        if (body.petType) pet.type = String(body.petType).trim() as typeof pet.type;
        const rows = await db`
          UPDATE rooms SET pet_state = ${JSON.stringify(pet)}::jsonb, updated_at = NOW()
          WHERE room_id = ${roomId} RETURNING *
        `;
        return ok({ room: normalizeRoom(rows[0]) });
      }

      const def: PetActionDef | undefined = PET_ACTION_MAP[action];
      if (!def) return fail('Hành động pet không hợp lệ');

      const result = carePet(current.pet_state, action, now);

      // Care that wasn't needed (stat already met / pet exhausted): persist mood only, no rewards.
      if (result.wasted) {
        const rows = await db`
          UPDATE rooms SET pet_state = ${JSON.stringify(result.pet)}::jsonb, updated_at = NOW()
          WHERE room_id = ${roomId} RETURNING *
        `;
        return ok({
          room: normalizeRoom(rows[0]),
          care: { wasted: true, message: result.message, xpGain: 0, coinGain: 0, leveledUp: false }
        });
      }

      const streakUpd = bumpStreak(current.streak, now);
      const season = activeSeason();
      const coinGain = result.coinGain + streakUpd.coinBonus + (season?.coinBonus || 0) + (result.leveledUp ? result.newLevel * 5 : 0);

      const rows = await db`
        UPDATE rooms
        SET pet_state = ${JSON.stringify(result.pet)}::jsonb,
            streak = ${JSON.stringify(streakUpd.streak)}::jsonb,
            coins = coins + ${coinGain},
            activities = jsonb_build_array(
              jsonb_build_object('emoji', ${def.emoji}::text, 'message', ${`${result.pet.name} ${def.toast}`}::text, 'createdAt', ${new Date().toISOString()}::text)
            ) || COALESCE(activities, '[]'::jsonb),
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      await logEvent(db, roomId, 'pet.care', `${actorName} ${def.label.toLowerCase()} cho ${result.pet.name}`, {
        actorName,
        emoji: def.emoji,
        payload: { petAction: action }
      });
      if (result.leveledUp) {
        await logEvent(db, roomId, 'pet.levelup', `${result.pet.name} lên Lv.${result.newLevel}! 🎉`, { emoji: '⭐', payload: { level: result.newLevel } });
        await pushToRoom(db, roomId, actorClientId, { title: '🎉 Thú cưng lên cấp!', body: `${result.pet.name} đã lên Lv.${result.newLevel}`, url: `/room/${roomId}`, tag: 'levelup' });
      }
      if (streakUpd.milestone) {
        await logEvent(db, roomId, 'streak.milestone', `Đạt chuỗi ${streakUpd.milestone} ngày chăm pet! 🔥`, { emoji: '🔥', payload: { milestone: streakUpd.milestone } });
      }
      return ok({
        room: normalizeRoom(rows[0]),
        care: { wasted: false, message: result.message, xpGain: result.xpGain, coinGain, leveledUp: result.leveledUp }
      });
    }

    // ---- shop: buy ----
    if (type === 'shop') {
      const itemId = String(body.itemId || '');
      const actorName = String(body.actorName || '').trim() || 'Ai đó';
      const item = SHOP_MAP[itemId];
      if (!item) return fail('Vật phẩm không tồn tại');
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return fail('Room không tồn tại', 404);
      const current = existing[0];
      const pet = normalizePet(current.pet_state);
      const coins = current.coins || 0;
      const check = canBuy(item, pet, coins);
      if (!check.ok) return fail(check.reason || 'Không thể mua', 400);

      const inv = normalizeInventory(current.inventory);
      let updatedPet = pet;
      if (item.cosmetic) {
        if (!inv.owned.includes(itemId)) inv.owned.push(itemId);
      } else {
        // consumable: apply effect immediately
        const eff = FOOD_EFFECTS[itemId] || {};
        for (const [k, v] of Object.entries(eff)) {
          (updatedPet as any)[k] = clamp((updatedPet as any)[k] + v, 0, 100);
        }
        updatedPet.xp = Math.max(0, updatedPet.xp + 2);
      }
      const rows = await db`
        UPDATE rooms
        SET coins = coins - ${item.price},
            inventory = ${JSON.stringify(inv)}::jsonb,
            pet_state = ${JSON.stringify(updatedPet)}::jsonb,
            updated_at = NOW()
        WHERE room_id = ${roomId}
        RETURNING *
      `;
      await logEvent(db, roomId, 'shop.buy', `${actorName} mua ${item.name} ${item.emoji}`, { actorName, emoji: item.emoji, payload: { itemId } });
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- theme ----
    if (type === 'theme') {
      const theme = { ...DEFAULT_THEME, ...(body.themeConfig || {}) };
      const persist = body.persist !== false;
      const rows = persist
        ? await db`
            UPDATE rooms SET theme_config = ${JSON.stringify(theme)}::jsonb, session_theme_config = NULL, session_theme_expires_at = NULL, updated_at = NOW()
            WHERE room_id = ${roomId} RETURNING *
          `
        : await db`
            UPDATE rooms SET session_theme_config = ${JSON.stringify(theme)}::jsonb, session_theme_expires_at = NOW() + INTERVAL '8 hours', updated_at = NOW()
            WHERE room_id = ${roomId} RETURNING *
          `;
      if (!rows[0]) return fail('Room không tồn tại', 404);
      await logEvent(db, roomId, 'theme.changed', `Đã đổi giao diện room thành ${theme.name || theme.templateId}`, { emoji: '🎨', payload: { templateId: theme.templateId, persist } });
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- custom actions ----
    if (type === 'actions') {
      const incoming = (Array.isArray(body.actions) ? body.actions : DEFAULT_ACTIONS).slice(0, 9);
      const actions = incoming.map((a: Partial<RoomAction>, i: number) => cleanAction(a, i));
      const rows = await db`
        UPDATE rooms SET room_actions = ${JSON.stringify(actions)}::jsonb, updated_at = NOW()
        WHERE room_id = ${roomId} RETURNING *
      `;
      if (!rows[0]) return fail('Room không tồn tại', 404);
      await logEvent(db, roomId, 'custom_action.saved', 'Đã cập nhật bộ hành động của room', { emoji: '✨', payload: { count: actions.length } });
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- heartbeat / leave ----
    if (type === 'heartbeat' || type === 'leave') {
      const clientId = String(body.clientId || '').trim();
      if (!clientId) return fail('Missing clientId');
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return fail('Room không tồn tại', 404);
      const current = existing[0];
      const isLeaving = type === 'leave';
      let rows;
      if (current.creator_client_id === clientId) {
        rows = await db`
          UPDATE rooms SET creator_last_seen_at = NOW(), creator_left_at = ${isLeaving ? new Date().toISOString() : null}, updated_at = NOW()
          WHERE room_id = ${roomId} RETURNING *
        `;
      } else if (current.partner_client_id === clientId) {
        rows = await db`
          UPDATE rooms SET partner_last_seen_at = NOW(), partner_left_at = ${isLeaving ? new Date().toISOString() : null}, updated_at = NOW()
          WHERE room_id = ${roomId} RETURNING *
        `;
      } else {
        return fail('Bạn không thuộc room này', 403);
      }
      if (isLeaving) {
        const name = current.creator_client_id === clientId ? current.creator_name : current.partner_name;
        await logEvent(db, roomId, 'room.left', `${name || 'Ai đó'} rời room`, { actorClientId: clientId, actorName: name, emoji: '👋' });
      }
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- sulk / giận ----
    if (type === 'sulk') {
      const clientId = String(body.clientId || '').trim();
      if (!clientId) return fail('Missing clientId');
      const sub = String(body.sulkAction || '');
      const existing = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return fail('Room không tồn tại', 404);
      const cur = existing[0];
      const isCreator = cur.creator_client_id === clientId;
      const isPartner = cur.partner_client_id === clientId;
      if (!isCreator && !isPartner) return fail('Bạn không thuộc room này', 403);
      const me = (isCreator ? cur.creator_name : cur.partner_name) || 'Người ấy';
      const sulk = normalizeSulk(cur.sulk);

      if (sub === 'start') {
        const reasons = (Array.isArray(body.reasons) ? body.reasons : []).map(String).filter(Boolean).slice(0, 5);
        if (!reasons.length) return fail('Chọn ít nhất 1 lý do giận');
        const hint = String(body.hint || '').trim().slice(0, 120) || null;
        const next: SulkState = {
          active: true,
          byClientId: clientId,
          byName: me,
          reasons,
          reasonCount: reasons.length,
          hint,
          guesses: [],
          startedAt: new Date().toISOString(),
          resolvedAt: null
        };
        const rows = await db`UPDATE rooms SET sulk = ${JSON.stringify(next)}::jsonb, updated_at = NOW() WHERE room_id = ${roomId} RETURNING *`;
        await logEvent(db, roomId, 'sulk.start', `${me} đang giận 😤`, { actorClientId: clientId, actorName: me, emoji: '😤' });
        await pushToRoom(db, roomId, clientId, { title: `${me} đang giận 😤`, body: 'Mở app và đoán xem vì sao nhé!', url: `/room/${roomId}`, tag: 'sulk' });
        return ok({ room: redactRoomSulk(normalizeRoom(rows[0])!, clientId) });
      }

      if (sub === 'guess') {
        if (!sulk.active) return fail('Không có ai đang giận cả');
        if (sulk.byClientId === clientId) return fail('Bạn là người đang giận mà 😤');
        const guess = String(body.guess || '');
        const correct = sulk.reasons.includes(guess);
        sulk.guesses = [...sulk.guesses, { text: guess, correct, at: new Date().toISOString(), by: me }].slice(-30);
        if (correct) {
          sulk.active = false;
          sulk.resolvedAt = new Date().toISOString();
        }
        const rows = await db`UPDATE rooms SET sulk = ${JSON.stringify(sulk)}::jsonb, coins = coins + ${correct ? 5 : 0}, updated_at = NOW() WHERE room_id = ${roomId} RETURNING *`;
        if (correct) {
          await logEvent(db, roomId, 'sulk.resolved', `${me} đã đoán đúng và làm hòa 💗`, { actorClientId: clientId, actorName: me, emoji: '💗' });
          await pushToRoom(db, roomId, clientId, { title: 'Làm hòa rồi 💗', body: `${me} đã đoán đúng lý do!`, url: `/room/${roomId}`, tag: 'sulk' });
        } else {
          await logEvent(db, roomId, 'sulk.guess', `${me} đoán sai lý do...`, { actorClientId: clientId, actorName: me, emoji: '❓' });
        }
        return ok({ room: redactRoomSulk(normalizeRoom(rows[0])!, clientId) });
      }

      if (sub === 'forgive' || sub === 'cancel') {
        if (sulk.byClientId && sulk.byClientId !== clientId) return fail('Chỉ người đang giận mới làm điều này');
        sulk.active = false;
        sulk.resolvedAt = new Date().toISOString();
        const rows = await db`UPDATE rooms SET sulk = ${JSON.stringify(sulk)}::jsonb, updated_at = NOW() WHERE room_id = ${roomId} RETURNING *`;
        await logEvent(db, roomId, 'sulk.forgive', `${me} đã hết giận, làm hòa 💗`, { actorClientId: clientId, actorName: me, emoji: '💗' });
        return ok({ room: redactRoomSulk(normalizeRoom(rows[0])!, clientId) });
      }

      return fail('Unknown sulk action');
    }

    // ---- live touch (hold hands) ----
    if (type === 'touch') {
      const clientId = String(body.clientId || '').trim();
      if (!clientId) return fail('Missing clientId');
      const state = String(body.state || 'start');
      const val = state === 'end' ? null : new Date().toISOString();
      const existing = await db`SELECT creator_client_id, partner_client_id FROM rooms WHERE room_id = ${roomId}`;
      if (!existing[0]) return fail('Room không tồn tại', 404);
      const isCreator = existing[0].creator_client_id === clientId;
      const isPartner = existing[0].partner_client_id === clientId;
      if (!isCreator && !isPartner) return fail('Bạn không thuộc room này', 403);
      const rows = isCreator
        ? await db`UPDATE rooms SET creator_touch_at = ${val}, updated_at = NOW() WHERE room_id = ${roomId} RETURNING *`
        : await db`UPDATE rooms SET partner_touch_at = ${val}, updated_at = NOW() WHERE room_id = ${roomId} RETURNING *`;
      return ok({ room: normalizeRoom(rows[0]) });
    }

    // ---- session timer ----
    if (type === 'session') {
      const seconds = Math.max(0, Number(body.seconds || 0));
      const rows = await db`
        UPDATE rooms SET session_seconds = GREATEST(session_seconds, ${seconds}), updated_at = NOW()
        WHERE room_id = ${roomId} RETURNING *
      `;
      if (!rows[0]) return fail('Room không tồn tại', 404);
      return ok({ room: normalizeRoom(rows[0]) });
    }

    return fail('Unknown action type');
  } catch (error) {
    const e = error as ApiError;
    return fail(e.message || 'Server error', e.statusCode || 500);
  }
}
