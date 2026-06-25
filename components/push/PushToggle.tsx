'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/api-client';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = 'idle' | 'unsupported' | 'subscribed' | 'denied' | 'loading';

export function PushToggle({ roomId, clientId }: { roomId: string; clientId: string }) {
  const toast = useToast();
  const [state, setState] = useState<State>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setState('subscribed');
        else if (Notification.permission === 'denied') setState('denied');
      })
      .catch(() => {});
  }, []);

  async function enable() {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return toast('Chưa cấu hình VAPID key', 'warn');
    setState('loading');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState('denied');
        return toast('Bạn đã từ chối thông báo', 'warn');
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource
      });
      await api.savePushSubscription(roomId, clientId, sub.toJSON());
      setState('subscribed');
      toast('🔔 Đã bật thông báo!', 'success');
    } catch (e) {
      setState('idle');
      toast((e as Error).message || 'Không bật được thông báo', 'error');
    }
  }

  if (state === 'unsupported') {
    return <p className="text-sm text-muted">Trình duyệt này không hỗ trợ thông báo đẩy 😢</p>;
  }
  if (state === 'subscribed') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-teal/10 px-4 py-2.5 text-sm font-bold text-teal">
        <span>🔔</span> Thông báo đang bật trên thiết bị này
      </div>
    );
  }
  return (
    <Button variant="primary" fullWidth disabled={state === 'loading'} onClick={enable}>
      {state === 'loading' ? 'Đang bật...' : '🔔 Bật thông báo khi người yêu nhắn'}
    </Button>
  );
}
