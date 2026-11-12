import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { route, readJson, json, ApiError } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { passwordField } from '@/lib/validation/auth';
import { enforceRateLimit } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';

const schema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordField });

/** Change password; all other sessions are revoked. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await enforceRateLimit(req, 'password-change', { limit: 5, windowSeconds: 900, key: user.id });
  const { currentPassword, newPassword } = await readJson(req, schema);
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!(await verifyPassword(currentPassword, record.passwordHash))) {
    throw new ApiError(400, 'Your current password is incorrect', { currentPassword: 'Incorrect password' });
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } }),
    prisma.session.deleteMany({ where: { userId: user.id, id: { not: user.sessionId } } }),
  ]);
  await audit({ actor: user, action: 'auth.password_changed', entityType: 'User', entityId: user.id, req });
  return json({ ok: true });
});
