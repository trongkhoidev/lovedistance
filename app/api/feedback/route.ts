import { NextResponse } from 'next/server';
import { ApiError, getSql, initDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const limit = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get('limit') || 50)));
    const rows = await db`
      SELECT id, room_id, rating, message, created_at
      FROM feedback ORDER BY created_at DESC LIMIT ${limit}
    `;
    return NextResponse.json({ feedback: rows });
  } catch (error) {
    const e = error as ApiError;
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.statusCode || 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const roomId = String(body.roomId || '').trim().toUpperCase() || null;
    const rating = body.rating ? Math.max(1, Math.min(5, Number(body.rating))) : null;
    const message = String(body.message || '').trim() || null;
    if (!rating && !message) return NextResponse.json({ error: 'Missing feedback' }, { status: 400 });
    await db`INSERT INTO feedback (room_id, rating, message) VALUES (${roomId}, ${rating}, ${message})`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const e = error as ApiError;
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.statusCode || 500 });
  }
}
