'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import type { RoomBackground } from '@/lib/types';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

export function MediaUpload({ roomId, onUploaded }: { roomId: string; onUploaded: (bg: RoomBackground) => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) return toast('Chỉ hỗ trợ JPG, PNG, WebP, MP4, WebM', 'warn');
    const isVideo = file.type.startsWith('video/');
    if (isVideo && file.size > 40 * 1024 * 1024) return toast('Video tối đa 40MB', 'warn');
    if (!isVideo && file.size > 8 * 1024 * 1024) return toast('Ảnh tối đa 8MB', 'warn');

    setBusy(true);
    toast('Đang upload nền...', 'info');
    try {
      const blob = await upload(`rooms/${roomId}/background/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
        clientPayload: JSON.stringify({ roomId, contentType: file.type, size: file.size })
      });
      onUploaded({ type: isVideo ? 'video' : 'image', url: blob.url, contentType: file.type, size: file.size, loop: true, muted: true });
      toast('Đã lưu nền room 🎉', 'success');
    } catch (e) {
      toast((e as Error).message || 'Upload thất bại', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <Button variant="soft" fullWidth disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Đang upload...' : '🖼️ Upload ảnh/video nền'}
      </Button>
      <p className="mt-1.5 text-xs text-muted">Ảnh tối đa 8MB · Video MP4/WebM tối đa 40MB, tự phát lặp.</p>
    </div>
  );
}
