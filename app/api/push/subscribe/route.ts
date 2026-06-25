import { NextResponse } from 'next/server';
import { ApiError, getSql, initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const roomId = String(body.roomId || '').trim().toUpperCase();
    const clientId = String(body.clientId || '').trim();
    const sub = body.subscription;
    if (!roomId || !clientId || !sub?.endpoint || !sub?.keys) {
      return NextResponse.json({ error: 'Thiếu dữ liệu đăng ký' }, { status: 400 });
    }
    await db`
      INSERT INTO push_subscriptions (room_id, client_id, endpoint, keys)
      VALUES (${roomId}, ${clientId}, ${sub.endpoint}, ${JSON.stringify(sub.keys)}::jsonb)
      ON CONFLICT (endpoint) DO UPDATE SET room_id = ${roomId}, client_id = ${clientId}, keys = ${JSON.stringify(sub.keys)}::jsonb
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const e = error as ApiError;
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.statusCode || 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const endpoint = String(body.endpoint || '');
    if (endpoint) await db`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
