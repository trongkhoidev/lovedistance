import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Missing BLOB_READ_WRITE_TOKEN. Create a Vercel Blob store and redeploy.' },
      { status: 503 }
    );
  }
  try {
    const body = (await req.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      request: req,
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}');
        const roomId = String(payload.roomId || '').trim().toUpperCase();
        const contentType = String(payload.contentType || '');
        const size = Number(payload.size || 0);
        if (!roomId) throw new Error('Missing roomId');
        if (!ALLOWED_TYPES.includes(contentType)) throw new Error('Chỉ hỗ trợ JPG, PNG, WebP, MP4, WebM');
        const limit = contentType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (size > limit) throw new Error(contentType.startsWith('video/') ? 'Video tối đa 40MB' : 'Ảnh tối đa 8MB');
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: limit,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ roomId, contentType, size })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // eslint-disable-next-line no-console
        console.log(`Upload completed: ${blob.url}`);
      }
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Upload failed' }, { status: 400 });
  }
}
