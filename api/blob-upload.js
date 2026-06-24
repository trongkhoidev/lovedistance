const { handleUpload } = require('@vercel/blob/client');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm'
]);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Missing BLOB_READ_WRITE_TOKEN. Create a Vercel Blob store and redeploy.' });
  }

  try {
    const jsonResponse = await handleUpload({
      request: req,
      body: req.body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}');
        const roomId = String(payload.roomId || '').trim().toUpperCase();
        const contentType = String(payload.contentType || '');
        const size = Number(payload.size || 0);
        if (!roomId) throw new Error('Missing roomId');
        if (!ALLOWED_TYPES.has(contentType)) throw new Error('Chỉ hỗ trợ JPG, PNG, WebP, MP4, WebM');
        const limit = contentType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (size > limit) throw new Error(contentType.startsWith('video/') ? 'Video tối đa 40MB' : 'Ảnh tối đa 8MB');

        return {
          allowedContentTypes: [...ALLOWED_TYPES],
          maximumSizeInBytes: limit,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ roomId, contentType, size })
        };
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Upload failed' });
  }
};
