'use client';

import { Card, CardTitle } from '@/components/ui/Card';
import type { Room, RoomAction } from '@/lib/types';
import { ActionButton } from './ActionButton';

interface Props {
  room: Room;
  onSend: (action: RoomAction) => void;
}

export function ActionGrid({ room, onSend }: Props) {
  return (
    <Card>
      <CardTitle icon="💌">Gửi cảm xúc cho người yêu</CardTitle>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {room.actions.map((a) => (
          <ActionButton key={a.key} action={a} count={room.counts[a.key] || 0} onSend={onSend} />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        💡 Một số hành động có thể <b>giữ nút</b> để gửi — thả ra để kết thúc
      </p>
    </Card>
  );
}
