'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { api } from '@/lib/api-client';

export function FeedbackCard({ roomId }: { roomId: string }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!rating && !message.trim()) return toast('⚠️ Chọn sao hoặc viết góp ý nhé!', 'warn');
    setBusy(true);
    try {
      await api.sendFeedback(roomId, rating || null, message.trim() || null);
      toast('💌 Cảm ơn bạn! Góp ý đã được ghi nhận 🙏', 'success');
      setRating(0);
      setMessage('');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? '' : 'opacity-30 grayscale'}`}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Ví dụ: Muốn có mini game đôi, nghe nhạc cùng nhau..."
        className="w-full resize-none rounded-2xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <Button variant="primary" fullWidth disabled={busy} onClick={submit}>
        Gửi góp ý 💌
      </Button>
    </div>
  );
}
