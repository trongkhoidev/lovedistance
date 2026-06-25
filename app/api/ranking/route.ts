import { NextResponse } from 'next/server';
import { ApiError, getSql, initDb } from '@/lib/db';
import { normalizePet } from '@/lib/pet';
import type { RankRow } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function coupleName(creator: string | null, partner: string | null): string {
  const a = creator || 'Ai đó';
  return partner ? `${a} 💛 ${partner}` : a;
}

export async function GET(req: Request) {
  try {
    await initDb();
    const db = getSql();
    const params = new URL(req.url).searchParams;
    const metric = params.get('metric') === 'petLevel' ? 'petLevel' : 'interactions';
    const period = ['week', 'month', 'all'].includes(params.get('period') || '') ? params.get('period')! : 'all';

    if (metric === 'petLevel') {
      // pet level is cumulative — period filter is not meaningful, always all-time
      const rows = await db`
        SELECT room_id, creator_name, partner_name, pet_state
        FROM rooms
        WHERE partner_client_id IS NOT NULL
        ORDER BY (pet_state->>'level')::int DESC NULLS LAST, total DESC
        LIMIT 50
      `;
      const result: RankRow[] = rows.map((r: any) => {
        const pet = normalizePet(r.pet_state);
        return {
          roomId: r.room_id,
          coupleName: coupleName(r.creator_name, r.partner_name),
          petName: pet.name,
          petType: pet.type,
          petLevel: pet.level,
          value: pet.level
        };
      });
      return NextResponse.json({ rows: result });
    }

    // interactions metric
    const interval = period === 'week' ? '7 days' : period === 'month' ? '30 days' : null;
    const rows = interval
      ? await db`
          SELECT e.room_id, COUNT(*)::int AS cnt, r.creator_name, r.partner_name, r.pet_state
          FROM room_events e
          JOIN rooms r ON r.room_id = e.room_id
          WHERE e.event_type = 'action.sent'
            AND r.partner_client_id IS NOT NULL
            AND e.created_at > NOW() - (${interval}::interval)
          GROUP BY e.room_id, r.creator_name, r.partner_name, r.pet_state
          ORDER BY cnt DESC
          LIMIT 50
        `
      : await db`
          SELECT r.room_id, r.total::int AS cnt, r.creator_name, r.partner_name, r.pet_state
          FROM rooms r
          WHERE r.partner_client_id IS NOT NULL AND r.total > 0
          ORDER BY r.total DESC
          LIMIT 50
        `;
    const result: RankRow[] = rows.map((r: any) => {
      const pet = normalizePet(r.pet_state);
      return {
        roomId: r.room_id,
        coupleName: coupleName(r.creator_name, r.partner_name),
        petName: pet.name,
        petType: pet.type,
        petLevel: pet.level,
        value: Number(r.cnt) || 0
      };
    });
    return NextResponse.json({ rows: result });
  } catch (error) {
    const e = error as ApiError;
    return NextResponse.json({ error: e.message || 'Server error' }, { status: e.statusCode || 500 });
  }
}
