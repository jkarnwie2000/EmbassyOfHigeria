import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { env } from './env';
import { SESSION_COOKIE } from './auth/constants';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const unauthorized = (msg = 'Authentication required') => new ApiError(401, msg);
export const forbidden = (msg = 'You do not have permission to perform this action') =>
  new ApiError(403, msg);
export const notFound = (msg = 'Not found') => new ApiError(404, msg);

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF defence-in-depth. Session cookies are SameSite=Lax, and in addition every
 * state-changing request must come from our own origin.
 */
export function assertSameOrigin(req) {
  if (!MUTATING.has(req.method)) return;
  const origin = req.headers.get('origin');
  const allowed = new Set([env.appUrl]);
  try {
    allowed.add(new URL(req.url).origin);
  } catch {
    /* ignore */
  }
  if (origin) {
    if (!allowed.has(origin)) throw new ApiError(403, 'Cross-origin request rejected');
    return;
  }
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    throw new ApiError(403, 'Cross-origin request rejected');
  }
  // No Origin header: only permitted for requests that carry no session (e.g. server-to-server).
  if (req.headers.get('cookie')?.includes(SESSION_COOKIE)) {
    throw new ApiError(403, 'Missing Origin header');
  }
}

/**
 * Wraps a route handler with origin checking and uniform error handling.
 * Internal error details are logged server-side and never returned to clients.
 */
export function route(fn, { skipOriginCheck = false } = {}) {
  return async (req, ctx) => {
    try {
      if (!skipOriginCheck) assertSameOrigin(req);
      const params = ctx?.params ? await ctx.params : {};
      return await fn(req, { params });
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, ...(err.details ? { details: err.details } : {}) },
          { status: err.status }
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: err.flatten().fieldErrors },
          { status: 400 }
        );
      }
      console.error('[api] unhandled error', err);
      return NextResponse.json(
        { error: 'An unexpected error occurred. Please try again later.' },
        { status: 500 }
      );
    }
  };
}

export async function readJson(req, schema) {
  let body;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON');
  }
  if (!schema) return body;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Please correct the highlighted fields', flattenIssues(parsed.error));
  }
  return parsed.data;
}

/** Flattens nested Zod issues into { "section.field": "message" } */
export function flattenIssues(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export function json(data, init) {
  return NextResponse.json(data, init);
}
