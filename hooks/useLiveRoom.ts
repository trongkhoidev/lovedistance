'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import { getPresence } from '@/lib/presence';
import type { Room, RoomEvent } from '@/lib/types';

const MAX_EVENTS = 80;

interface UseLiveRoomResult {
  room: Room | null;
  events: RoomEvent[];
  loading: boolean;
  connected: boolean;
  presence: ReturnType<typeof getPresence>;
  applyRoom: (room: Room) => void;
  pokeEvents: () => void;
}

/**
 * Realtime room subscription via Server-Sent Events.
 * The server pushes `room` and `events` messages; presence is kept alive
 * server-side while the stream is open. Falls back gracefully on reconnect.
 */
export function useLiveRoom(roomId: string, clientId: string): UseLiveRoomResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());
  const mounted = useRef(true);

  const applyRoom = useCallback((r: Room) => {
    if (mounted.current) setRoom(r);
  }, []);

  const mergeEvents = useCallback((incoming: RoomEvent[]) => {
    if (!incoming.length) return;
    setEvents((prev) => {
      const next = [...prev];
      for (const e of incoming) {
        if (!seenIds.current.has(e.id)) {
          seenIds.current.add(e.id);
          next.push(e);
        }
      }
      next.sort((a, b) => a.id - b.id);
      return next.slice(-MAX_EVENTS);
    });
  }, []);

  // initial fast paint
  useEffect(() => {
    mounted.current = true;
    if (!roomId) return;
    (async () => {
      try {
        const [r, ev] = await Promise.all([api.getRoom(roomId), api.getEvents(roomId)]);
        if (!mounted.current) return;
        setRoom(r.room);
        mergeEvents(ev.events);
      } catch {
        /* stream will retry */
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [roomId, mergeEvents]);

  // SSE subscription
  useEffect(() => {
    if (!roomId || !clientId) return;
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      es = new EventSource(`/api/stream?roomId=${encodeURIComponent(roomId)}&clientId=${encodeURIComponent(clientId)}`);
      es.addEventListener('open', () => mounted.current && setConnected(true));
      es.addEventListener('room', (e) => {
        try {
          const { room: r } = JSON.parse((e as MessageEvent).data);
          if (r && mounted.current) setRoom(r);
        } catch {
          /* ignore */
        }
      });
      es.addEventListener('events', (e) => {
        try {
          const { events: ev } = JSON.parse((e as MessageEvent).data);
          mergeEvents(ev);
        } catch {
          /* ignore */
        }
      });
      es.addEventListener('error', () => {
        setConnected(false);
        es?.close();
        if (!stopped) {
          retry = setTimeout(connect, 1500);
        }
      });
    };
    connect();

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      es?.close();
      setConnected(false);
    };
  }, [roomId, clientId, mergeEvents]);

  const presence = getPresence(room, clientId);
  return { room, events, loading, connected, presence, applyRoom, pokeEvents: () => {} };
}
