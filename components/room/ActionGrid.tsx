'use client';

import { Card, CardTitle } from '@/components/ui/Card';
import type { Room, RoomAction } from '@/lib/types';
import { EmotionComposer } from './EmotionComposer';
import { HoldHands } from './HoldHands';

interface Props {
  room: Room;
  partnerName: string;
  partnerTouching: boolean;
  partnerOnline: boolean;
  todayCount: number;
  onSend: (action: RoomAction, level: number, note?: string) => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  canSulk: boolean;
  onOpenSulk: () => void;
}

export function ActionGrid({
  room,
  partnerName,
  partnerTouching,
  partnerOnline,
  todayCount,
  onSend,
  onHoldStart,
  onHoldEnd,
  canSulk,
  onOpenSulk
}: Props) {
  const emotions = room.actions.filter((a) => a.key !== 'hold-hand');
  const holdCount = room.counts['hold-hand'] || 0;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle icon="💌" className="!mb-0">
          Gửi cảm xúc cho người yêu
        </CardTitle>
        <span className="rounded-pill bg-love/10 px-3 py-1 text-xs font-bold text-love">Hôm nay 💞 {todayCount}</span>
      </div>

      <HoldHands
        partnerName={partnerName}
        partnerTouching={partnerTouching}
        partnerOnline={partnerOnline}
        onHoldStart={onHoldStart}
        onHoldEnd={onHoldEnd}
      />
      <p className="mb-4 mt-1.5 text-center text-xs text-muted">
        🤝 Đã nắm tay <b>{holdCount}</b> lần · giữ nút để người ấy thấy bạn đang nắm tay theo thời gian thực
      </p>

      <EmotionComposer actions={emotions} onSend={onSend} />

      {canSulk && (
        <button
          onClick={onOpenSulk}
          className="focus-ring mt-3 w-full rounded-2xl border-2 border-dashed border-love/40 py-2 text-sm font-bold text-love transition-colors hover:bg-love/10"
        >
          😤 Giận dỗi — khóa & bắt người ấy đoán lý do
        </button>
      )}
    </Card>
  );
}
