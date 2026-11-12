import crypto from 'node:crypto';
import { prisma } from '../prisma';
import { env } from '../env';
import { SESSION_COOKIE } from './constants';
import { clientIp } from '../http';

const STAFF_ROLES = new Set(['STAFF', 'ADMIN', 'SUPER_ADMIN']);

export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  permissions: true,
  active: true,
  departments: { select: { department: { select: { id: true, slug: true, name: true, handlesType: true } } } },
};

export async function createSession(user, req) {
  const token = crypto.randomBytes(32).toString('base64url');
  const hours = env.sessionTtlHours(STAFF_ROLES.has(user.role));
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
  await prisma.session.create({
    data: {
      tokenHash: sha256(token),
      userId: user.id,
      expiresAt,
      ip: req ? clientIp(req) : null,
      userAgent: req?.headers.get('user-agent')?.slice(0, 300) ?? null,
    },
  });
  return { token, expiresAt };
}

export function setSessionCookie(response, token, expiresAt) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function shapeUser(user) {
  return {
    ...user,
    departments: user.departments.map((d) => d.department),
  };
}

export async function getUserFromToken(token) {
  if (!token || typeof token !== 'string' || token.length > 200) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: userSelect } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date() || !session.user.active) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // Touch at most every 5 minutes to limit writes
  if (Date.now() - session.lastUsedAt.getTime() > 5 * 60 * 1000) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
  }
  return { ...shapeUser(session.user), sessionId: session.id };
}

/** For route handlers: resolves the signed-in user from the request cookie. */
export function getSessionUser(req) {
  return getUserFromToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function destroySession(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

export function revokeAllSessions(userId) {
  return prisma.session.deleteMany({ where: { userId } });
}
