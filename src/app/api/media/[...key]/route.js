import { NextResponse } from 'next/server';
import { getStorage, assertSafeKey } from '@/lib/storage';

/**
 * Public media (announcement / homepage images uploaded by staff). Only keys under
 * "public/" are served; application documents can never be reached through here.
 */
export async function GET(_req, ctx) {
  const { key: parts } = await ctx.params;
  const key = ['public', ...parts].join('/');
  try {
    assertSafeKey(key);
    const { body, contentType } = await getStorage().get(key);
    if (!['image/jpeg', 'image/png'].includes(contentType)) throw new Error('bad type');
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
