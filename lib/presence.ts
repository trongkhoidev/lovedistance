import type { Room } from './types';

export const ONLINE_WINDOW_MS = 12_000;

export interface Presence {
  online: boolean;
  joined: boolean;
  lastSeenAt: string | null;
  joinedAt: string | null;
}

function isOnline(lastSeenAt: string | null, leftAt: string | null, nowMs: number): boolean {
  if (!lastSeenAt) return false;
  if (leftAt && new Date(leftAt).getTime() > new Date(lastSeenAt).getTime()) return false;
  return nowMs - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

export function getPresence(room: Room | null, clientId: string, nowMs = Date.now()) {
  if (!room) {
    return {
      me: { online: false, joined: false, lastSeenAt: null, joinedAt: null } as Presence,
      partner: { online: false, joined: false, lastSeenAt: null, joinedAt: null } as Presence,
      bothOnline: false,
      iAmCreator: false,
      myName: '',
      partnerName: ''
    };
  }
  const iAmCreator = room.creatorClientId === clientId;

  const creator: Presence = {
    online: isOnline(room.creatorLastSeenAt, room.creatorLeftAt, nowMs),
    joined: !!room.creatorClientId,
    lastSeenAt: room.creatorLastSeenAt,
    joinedAt: room.creatorJoinedAt
  };
  const partner: Presence = {
    online: isOnline(room.partnerLastSeenAt, room.partnerLeftAt, nowMs),
    joined: !!room.partnerClientId,
    lastSeenAt: room.partnerLastSeenAt,
    joinedAt: room.partnerJoinedAt
  };

  const me = iAmCreator ? creator : partner;
  const other = iAmCreator ? partner : creator;
  return {
    me,
    partner: other,
    bothOnline: creator.online && partner.online,
    iAmCreator,
    myName: (iAmCreator ? room.creatorName : room.partnerName) || '',
    partnerName: (iAmCreator ? room.partnerName : room.creatorName) || ''
  };
}

export function coupleLabel(room: Room | null): string {
  if (!room) return '';
  const a = room.creatorName || 'Ai đó';
  const b = room.partnerName;
  return b ? `${a} 💛 ${b}` : a;
}
