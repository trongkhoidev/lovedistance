import type { Room, SulkState } from './types';

export interface SulkReason {
  id: string;
  label: string;
  emoji: string;
}

/** Catalog of common couple sulk reasons (used for hidden pick + guessing). */
export const SULK_REASONS: SulkReason[] = [
  { id: 'reply', label: 'Không trả lời tin nhắn', emoji: '📵' },
  { id: 'slow', label: 'Trả lời chậm, lơ là', emoji: '🐢' },
  { id: 'forget', label: 'Quên ngày quan trọng', emoji: '📅' },
  { id: 'busy', label: 'Mải chơi game / bận việc khác', emoji: '🎮' },
  { id: 'jealous', label: 'Làm tớ ghen', emoji: '😒' },
  { id: 'promise', label: 'Thất hứa', emoji: '🤥' },
  { id: 'words', label: 'Nói lời khó nghe', emoji: '💢' },
  { id: 'cold', label: 'Vô tâm, không quan tâm', emoji: '🥀' },
  { id: 'pet', label: 'Bỏ bê thú cưng', emoji: '🐾' },
  { id: 'nomeet', label: 'Đi chơi không rủ', emoji: '🚶' }
];

export const SULK_MAP = Object.fromEntries(SULK_REASONS.map((r) => [r.id, r]));

export const DEFAULT_SULK: SulkState = {
  active: false,
  byClientId: null,
  byName: null,
  reasons: [],
  reasonCount: 0,
  hint: null,
  guesses: [],
  startedAt: null,
  resolvedAt: null
};

export function normalizeSulk(raw: unknown): SulkState {
  const s = (raw || {}) as Partial<SulkState>;
  return {
    active: !!s.active,
    byClientId: s.byClientId ?? null,
    byName: s.byName ?? null,
    reasons: Array.isArray(s.reasons) ? s.reasons : [],
    reasonCount: Array.isArray(s.reasons) ? s.reasons.length : s.reasonCount ?? 0,
    hint: s.hint ?? null,
    guesses: Array.isArray(s.guesses) ? s.guesses : [],
    startedAt: s.startedAt ?? null,
    resolvedAt: s.resolvedAt ?? null
  };
}

/** Hide the secret reasons from everyone except the sulker. */
export function redactRoomSulk(room: Room, viewerClientId: string | null): Room {
  if (!room.sulk?.active) return room;
  if (room.sulk.byClientId && room.sulk.byClientId === viewerClientId) return room;
  return { ...room, sulk: { ...room.sulk, reasons: [] } };
}
