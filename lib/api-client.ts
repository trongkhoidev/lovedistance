import type { PetActionKey, RankMetric, RankPeriod, RankRow, Room, RoomAction, RoomEvent, ThemeConfig } from './types';

async function post<T = { room: Room }>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Có lỗi xảy ra');
  return data as T;
}

export const api = {
  async createRoom(roomId: string, name: string, clientId: string) {
    return post({ type: 'create', roomId, name, clientId });
  },
  async joinRoom(roomId: string, name: string, clientId: string) {
    return post({ type: 'join', roomId, name, clientId });
  },
  async getRoom(roomId: string): Promise<{ room: Room }> {
    const res = await fetch(`/api/rooms?roomId=${encodeURIComponent(roomId)}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Không tải được room');
    return data;
  },
  async sendAction(roomId: string, action: RoomAction, actorName: string, clientId?: string) {
    const message = action.message.replace('{name}', actorName || 'Ai đó');
    return post({ type: 'action', roomId, key: action.key, emoji: action.emoji, message, actorName, clientId });
  },
  async carePet(roomId: string, petAction: PetActionKey, actorName?: string, clientId?: string) {
    return post({ type: 'pet', roomId, petAction, actorName, clientId });
  },
  async updatePet(roomId: string, patch: { name?: string; petType?: string }) {
    return post({ type: 'pet', roomId, ...patch });
  },
  async equip(roomId: string, slot: 'hat' | 'outfit' | 'scene', itemId: string | null) {
    return post({ type: 'pet', roomId, equip: { slot, itemId } });
  },
  async buyItem(roomId: string, itemId: string, actorName?: string) {
    return post({ type: 'shop', roomId, itemId, actorName });
  },
  async setTheme(roomId: string, themeConfig: ThemeConfig, persist = true) {
    return post({ type: 'theme', roomId, themeConfig, persist });
  },
  async setActions(roomId: string, actions: RoomAction[]) {
    return post({ type: 'actions', roomId, actions });
  },
  async heartbeat(roomId: string, clientId: string) {
    return post({ type: 'heartbeat', roomId, clientId });
  },
  async leave(roomId: string, clientId: string) {
    return fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ type: 'leave', roomId, clientId })
    });
  },
  async getEvents(roomId: string, afterId = 0, limit = 50): Promise<{ events: RoomEvent[] }> {
    const q = new URLSearchParams({ roomId, limit: String(limit) });
    if (afterId > 0) q.set('afterId', String(afterId));
    const res = await fetch(`/api/events?${q.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Không tải được log');
    return data;
  },
  async sendFeedback(roomId: string | null, rating: number | null, message: string | null) {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, rating, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Gửi góp ý thất bại');
    return data;
  },
  async getRanking(metric: RankMetric, period: RankPeriod): Promise<{ rows: RankRow[] }> {
    const res = await fetch(`/api/ranking?metric=${metric}&period=${period}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Không tải được bảng xếp hạng');
    return data;
  },
  async savePushSubscription(roomId: string, clientId: string, subscription: PushSubscriptionJSON) {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, clientId, subscription })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Đăng ký thông báo thất bại');
    return data;
  }
};

export function genRoomId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  const arr = new Uint32Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < 6; i++) id += alphabet[arr[i] % alphabet.length];
  } else {
    for (let i = 0; i < 6; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}
