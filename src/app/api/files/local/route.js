import { NextResponse } from 'next/server';
import { getStorage, verifyLocalSignature } from '@/lib/storage';

/**
 * Serves files from the LOCAL (development) storage driver, only with a valid,
 * unexpired HMAC signature. Production uses S3 presigned URLs instead.
 */
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const key = sp.get('key');
  const exp = sp.get('exp');
  const d = sp.get('d') === 'inline' ? 'inline' : 'attachment';
  if (!verifyLocalSignature(key, exp, d, sp.get('sig'))) {
    return NextResponse.json({ error: 'This link is invalid or has expired' }, { status: 403 });
  }
  try {
    const { body, contentType } = await getStorage().get(key);
    const ext = key.split('.').pop();
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${d}; filename="document.${ext}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
