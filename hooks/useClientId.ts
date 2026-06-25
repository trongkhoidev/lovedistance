'use client';

import { useEffect, useState } from 'react';
import { getClientId } from '@/lib/storage';

export function useClientId(): string {
  const [id, setId] = useState('');
  useEffect(() => {
    setId(getClientId());
  }, []);
  return id;
}
