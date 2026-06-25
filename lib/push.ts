import webpush from 'web-push';
import type { NeonQueryFunction } from '@neondatabase/serverless';

let configured = false;

function ensureConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hello@lovedistance.app', pub, priv);
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  emoji?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to every subscription of a room EXCEPT the actor's own client.
 * Best-effort: prunes dead subscriptions, never throws.
 */
export async function pushToRoom(
  db: NeonQueryFunction<false, false>,
  roomId: string,
  exceptClientId: string | null,
  payload: PushPayload
): Promise<void> {
  if (!ensureConfigured()) return;
  try {
    const subs = exceptClientId
      ? await db`SELECT id, endpoint, keys FROM push_subscriptions WHERE room_id = ${roomId} AND client_id <> ${exceptClientId}`
      : await db`SELECT id, endpoint, keys FROM push_subscriptions WHERE room_id = ${roomId}`;
    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s: any) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, body);
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await db`DELETE FROM push_subscriptions WHERE id = ${s.id}`.catch(() => {});
          }
        }
      })
    );
  } catch {
    /* ignore push errors */
  }
}
