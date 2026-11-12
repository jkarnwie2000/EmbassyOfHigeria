import { prisma } from '@/lib/prisma';
import { route, readJson, json, ApiError } from '@/lib/http';
import { loginSchema } from '@/lib/validation/auth';
import { verifyPassword, dummyVerify } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';
import { isStaff } from '@/lib/rbac';

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;
const GENERIC = 'Incorrect email address or password.';

export const POST = route(async (req) => {
  await enforceRateLimit(req, 'login-ip', { limit: 30, windowSeconds: 900 });
  const { email, password } = await readJson(req, loginSchema);
  await enforceRateLimit(req, 'login-email', { limit: 10, windowSeconds: 900, key: email });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await dummyVerify(password); // equalise timing
    throw new ApiError(401, GENERIC);
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit({ actor: user, action: 'auth.login_locked', entityType: 'User', entityId: user.id, req });
    throw new ApiError(423, 'This account is temporarily locked after repeated failed sign-in attempts. Please try again later.');
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok || !user.active) {
    const failures = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failures >= MAX_FAILURES ? 0 : failures,
        lockedUntil: failures >= MAX_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60000) : user.lockedUntil,
      },
    });
    await audit({ actor: user, action: 'auth.login_failed', entityType: 'User', entityId: user.id, req });
    throw new ApiError(401, GENERIC);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await audit({ actor: user, action: isStaff(user) ? 'auth.staff_login' : 'auth.login', entityType: 'User', entityId: user.id, req });

  const { token, expiresAt } = await createSession(user, req);
  const res = json({
    user: { id: user.id, firstName: user.firstName, role: user.role },
    redirectTo: isStaff(user) ? '/admin' : '/dashboard',
  });
  setSessionCookie(res, token, expiresAt);
  return res;
});
