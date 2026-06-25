import { NextResponse } from 'next/server';
import { ApiError, getSql, initDb } from '@/lib/db';
import { applyDecay } from '@/lib/pet';
import { pushToRoom } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called by Vercel Cron (see vercel.json). Reminds couples when their pet needs care.
export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await initDb();
    const db = getSql();
    const now = Date.now();
    const rooms = await db`
      SELECT room_id, pet_state FROM rooms
      WHERE partner_client_id IS NOT NULL
    `;
    let notified = 0;
    for (const r of rooms as any[]) {
      const pet = applyDecay(r.pet_state, now);
      const min = Math.min(pet.fullness, pet.hydration, pet.cleanliness, pet.energy, pet.happiness);
      if (min < 30) {
        const need =
          pet.fullness === min
            ? 'đang đói 🍙'
            : pet.hydration === min
              ? 'đang khát 💧'
              : pet.cleanliness === min
                ? 'cần tắm 🫧'
                : pet.energy === min
                  ? 'kiệt sức 😴'
                  : 'đang buồn 💔';
        await pushToRoom(db, r.room_id, null, {
          title: `${pet.name} ${need}`,
          body: 'Ghé thăm và chăm sóc bé cùng người yêu nhé!',
          url: `/room/${r.room_id}`,
          tag: 'reminder'
        });
        notified++;
      }
    }
    return NextResponse.json({ ok: true, checked: rooms.length, notified });
  } catch (error) {
    const e = error as ApiError;
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.statusCode || 500 });
  }
}
