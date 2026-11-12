import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from './lib/auth/constants';

/**
 * Fast first gate: visitors with no session cookie are redirected to sign-in before
 * any protected page renders. This is NOT the security boundary — every page and API
 * route still validates the session and permissions against the database.
 */
export function middleware(req) {
  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
