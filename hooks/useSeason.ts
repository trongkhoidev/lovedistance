'use client';

import { useEffect, useState } from 'react';
import { activeSeason, type Season } from '@/lib/season';

/** Resolves the active season on the client (avoids SSR/timezone hydration drift). */
export function useSeason(): Season | null {
  const [season, setSeason] = useState<Season | null>(null);
  useEffect(() => {
    setSeason(activeSeason());
  }, []);
  return season;
}
