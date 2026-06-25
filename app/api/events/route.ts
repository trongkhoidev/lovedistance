import { NextResponse } from 'next/server';
import { ApiError, getSql, initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const params = new URL(req.url).searchParams;
    const roomId = String(params.get('roomId') || '').trim().toUpperCase();
    const afterId = Number(params.get('afterId') || 0);
    const limit = Math.min(100, Math.max(1, Number(params.get('limit') || 50)));
    if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });

    const rows =
      afterId > 0
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
    return NextResponse.json({ events: afterId > 0 ? rows : rows.reverse() });
  } catch (error) {
    const e = error as ApiError;
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.statusCode || 500 });
  }
}
