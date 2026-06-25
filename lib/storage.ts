'use client';

const COOKIE_KEY = 'lvdist';
const CLIENT_KEY = 'lvdist_client_id';

export interface Prefs {
  name?: string;
  lastRoom?: string;
}

export function getClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

export function readPrefs(): Prefs {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_KEY}=`));
  if (!match) return {};
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return {};
  }
}

export function writePrefs(prefs: Prefs): void {
  if (typeof document === 'undefined') return;
  const merged = { ...readPrefs(), ...prefs };
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(merged))}; path=/; max-age=2592000`;
}
