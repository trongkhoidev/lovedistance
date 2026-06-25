import { ApiError, getSql, initDb, normalizeRoom } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TICK_MS = 1200;
const PRESENCE_EVERY = 4; // update last_seen every N ticks (~5s)
const LIFETIME_MS = 50_000; // close before platform timeout; client auto-reconnects

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = String(searchParams.get('roomId') || '').trim().toUpperCase();
  const clientId = String(searchParams.get('clientId') || '').trim();
  if (!roomId) return new Response('Missing roomId', { status: 400 });

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (cancelled) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const comment = () => !cancelled && controller.enqueue(encoder.encode(`: ping\n\n`));

      try {
        await initDb();
        const db = getSql();

        let lastEventId = 0;
        let lastUpdated = '';
        let tickCount = 0;
        const startTs = Date.now();

        // mark presence helper
        async function touchPresence() {
          if (!clientId) return;
          await db`
            UPDATE rooms SET
              creator_last_seen_at = CASE WHEN creator_client_id = ${clientId} THEN NOW() ELSE creator_last_seen_at END,
              creator_left_at = CASE WHEN creator_client_id = ${clientId} THEN NULL ELSE creator_left_at END,
              partner_last_seen_at = CASE WHEN partner_client_id = ${clientId} THEN NOW() ELSE partner_last_seen_at END,
              partner_left_at = CASE WHEN partner_client_id = ${clientId} THEN NULL ELSE partner_left_at END,
              updated_at = NOW()
            WHERE room_id = ${roomId}
          `.catch(() => {});
        }

        send('hello', { ok: true });

        while (!cancelled && Date.now() - startTs < LIFETIME_MS) {
          if (tickCount % PRESENCE_EVERY === 0) await touchPresence();
          tickCount++;

          const meta = await db`
            SELECT updated_at, (SELECT COALESCE(MAX(id), 0) FROM room_events WHERE room_id = ${roomId}) AS max_event
            FROM rooms WHERE room_id = ${roomId}
          `;
          if (!meta[0]) {
            send('gone', { error: 'Room không tồn tại' });
            break;
          }

          const updated = String(meta[0].updated_at);
          const maxEvent = Number(meta[0].max_event) || 0;

          if (updated !== lastUpdated) {
            lastUpdated = updated;
            const rows = await db`SELECT * FROM rooms WHERE room_id = ${roomId}`;
            send('room', { room: normalizeRoom(rows[0]) });
          }

          if (maxEvent > lastEventId) {
            const rows =
              lastEventId === 0
                ? await db`
                    SELECT id, room_id, actor_client_id, actor_name, event_type, emoji, message, payload, created_at
                    FROM room_events WHERE room_id = ${roomId} ORDER BY id DESC LIMIT 50
                  `
                : await db`
                    SELECT id, room_id, actor_client_id, actor_name, event_type, emoji, message, payload, created_at
                    FROM room_events WHERE room_id = ${roomId} AND id > ${lastEventId} ORDER BY id ASC LIMIT 50
                  `;
            const events = lastEventId === 0 ? rows.reverse() : rows;
            if (events.length) {
              lastEventId = Math.max(lastEventId, ...events.map((e: any) => Number(e.id)));
              send('events', { events });
            }
          } else {
            comment();
          }

          await sleep(TICK_MS);
        }
      } catch (error) {
        const e = error as ApiError;
        send('error', { error: e.message || 'stream error' });
      } finally {
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
