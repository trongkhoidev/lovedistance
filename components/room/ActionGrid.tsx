'use client';

import { Card, CardTitle } from '@/components/ui/Card';
import type { Room, RoomAction } from '@/lib/types';
import { EmotionButton } from './EmotionButton';
import { HoldHands } from './HoldHands';

const COLORS: Record<string, string> = {
  kiss: '#fb7185',
  hug: '#f59e0b',
  heart: '#f43f5e',
  miss: '#38bdf8',
  angry: '#a855f7',
  'hold-hand': '#2dd4bf'
};
const FALLBACK = ['#0ea5e9', '#14b8a6', '#fb7185', '#a78bfa', '#f59e0b', '#34d399'];

function colorFor(key: string, i: number) {
  return COLORS[key] || FALLBACK[i % FALLBACK.length];
}

interface Props {
  room: Room;
  partnerName: string;
  partnerTouching: boolean;
  partnerOnline: boolean;
  onSend: (action: RoomAction) => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}

export function ActionGrid({ room, partnerName, partnerTouching, partnerOnline, onSend, onHoldStart, onHoldEnd }: Props) {
  const grid = room.actions.filter((a) => a.key !== 'hold-hand');
  const holdCount = room.counts['hold-hand'] || 0;

  return (
    <Card>
      <CardTitle icon="💌">Gửi cảm xúc cho người yêu</CardTitle>

      <HoldHands
        partnerName={partnerName}
        partnerTouching={partnerTouching}
        partnerOnline={partnerOnline}
        onHoldStart={onHoldStart}
        onHoldEnd={onHoldEnd}
      />
      <p className="mb-3 mt-1.5 text-center text-xs text-muted">
        🤝 Đã nắm tay <b>{holdCount}</b> lần · giữ nút để người ấy thấy bạn đang nắm tay theo thời gian thực
      </p>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {grid.map((a, i) => (
          <EmotionButton key={a.key} action={a} count={room.counts[a.key] || 0} color={colorFor(a.key, i)} onSend={onSend} />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">💡 Cảm xúc bạn gửi sẽ hiện hiệu ứng trên màn hình của cả hai 💞</p>
    </Card>
  );
}
