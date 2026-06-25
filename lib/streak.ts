import type { Streak } from './types';

export const DEFAULT_STREAK: Streak = { count: 0, best: 0, lastCareDate: null };

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export function normalizeStreak(raw: Partial<Streak> | null | undefined): Streak {
  const s = raw || {};
  return {
    count: Math.max(0, Math.floor(Number(s.count) || 0)),
    best: Math.max(0, Math.floor(Number(s.best) || 0)),
    lastCareDate: typeof s.lastCareDate === 'string' ? s.lastCareDate : null
  };
}

/** YYYY-MM-DD in a fixed timezone (UTC+7, Vietnam) so day boundaries feel local. */
export function careDateKey(ms: number): string {
  const d = new Date(ms + 7 * 3_600_000);
  return d.toISOString().slice(0, 10);
}

export interface StreakUpdate {
  streak: Streak;
  advanced: boolean; // a new day was counted
  milestone: number | null; // milestone reached this update
  coinBonus: number;
}

export function bumpStreak(raw: Partial<Streak> | null | undefined, nowMs: number): StreakUpdate {
  const streak = normalizeStreak(raw);
  const today = careDateKey(nowMs);
  const yesterday = careDateKey(nowMs - 86_400_000);

  if (streak.lastCareDate === today) {
    return { streak, advanced: false, milestone: null, coinBonus: 0 };
  }

  streak.count = streak.lastCareDate === yesterday ? streak.count + 1 : 1;
  streak.lastCareDate = today;
  streak.best = Math.max(streak.best, streak.count);

  const milestone = STREAK_MILESTONES.includes(streak.count) ? streak.count : null;
  const coinBonus = milestone ? milestone : 0;
  return { streak, advanced: true, milestone, coinBonus };
}

export function badgeForCount(count: number): { emoji: string; label: string } {
  if (count >= 100) return { emoji: '👑', label: 'Huyền thoại' };
  if (count >= 60) return { emoji: '💎', label: 'Kim cương' };
  if (count >= 30) return { emoji: '🏆', label: 'Vàng' };
  if (count >= 14) return { emoji: '🥈', label: 'Bạc' };
  if (count >= 7) return { emoji: '🥉', label: 'Đồng' };
  if (count >= 3) return { emoji: '⭐', label: 'Khởi đầu' };
  return { emoji: '🌱', label: 'Mới chớm' };
}
