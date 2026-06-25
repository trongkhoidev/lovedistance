'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import { getPresence } from '@/lib/presence';
import type { Room, RoomEvent } from '@/lib/types';

const SYNC_MS = 4500;
const EVENTS_MS = 4500;
const HEARTBEAT_MS = 8000;
const MAX_EVENTS = 80;

interface UseRoomResult {
  room: Room | null;
  events: RoomEvent[];
  loading: boolean;
  error: string | null;
  presence: ReturnType<typeof getPresence>;
  applyRoom: (room: Room) => void;
  pokeEvents: () => void;
  refresh: () => Promise<void>;
}

export function useRoom(roomId: string, clientId: string): UseRoomResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastEventId = useRef(0);
  const lastHeartbeat = useRef(0);
  const mounted = useRef(true);

  const applyRoom = useCallback((r: Room) => {
    if (mounted.current) setRoom(r);
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!roomId) return;
    try {
      const { events: incoming } = await api.getEvents(roomId, lastEventId.current);
      if (!incoming.length || !mounted.current) return;
      if (lastEventId.current === 0) {
        setEvents(incoming.slice(-MAX_EVENTS));
      } else {
        setEvents((prev) => [...prev, ...incoming].slice(-MAX_EVENTS));
      }
      lastEventId.current = Math.max(lastEventId.current, ...incoming.map((e) => e.id));
    } catch {
      /* network hiccup — ignore */
    }
  }, [roomId]);

  const syncRoom = useCallback(async () => {
    if (!roomId || !clientId) return;
    try {
      const now = Date.now();
      let res;
      if (now - lastHeartbeat.current > HEARTBEAT_MS) {
        res = await api.heartbeat(roomId, clientId);
        lastHeartbeat.current = now;
      } else {
        res = await api.getRoom(roomId);
      }
      if (mounted.current && res.room) setRoom(res.room);
      setError(null);
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    }
  }, [roomId, clientId]);

  const refresh = useCallback(async () => {
    await Promise.all([syncRoom(), fetchEvents()]);
  }, [syncRoom, fetchEvents]);

  useEffect(() => {
    mounted.current = true;
    lastEventId.current = 0;
    if (!roomId || !clientId) return;
    setLoading(true);
    (async () => {
      await syncRoom();
      await fetchEvents();
      if (mounted.current) setLoading(false);
    })();

    const sIv = setInterval(syncRoom, SYNC_MS);
    const eIv = setInterval(fetchEvents, EVENTS_MS);
    return () => {
      mounted.current = false;
      clearInterval(sIv);
      clearInterval(eIv);
    };
  }, [roomId, clientId, syncRoom, fetchEvents]);

  const presence = getPresence(room, clientId);

  return { room, events, loading, error, presence, applyRoom, pokeEvents: fetchEvents, refresh };
}
