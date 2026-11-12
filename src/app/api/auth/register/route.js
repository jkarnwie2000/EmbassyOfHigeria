import { prisma } from '@/lib/prisma';
import { route, readJson, json, ApiError } from '@/lib/http';
import { registerSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rate-limit';
import { sendTemplate } from '@/lib/email';
import { audit } from '@/lib/audit';

export const POST = route(async (req) => {
  await enforceRateLimit(req, 'register', { limit: 5, windowSeconds: 3600 });
  const data = await readJson(req, registerSchema);

  const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) {
    throw new ApiError(409, 'An account already exists for this email address. Please sign in instead.');
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'APPLICANT', // public registration can never create staff accounts
    },
  });
  await audit({ actor: user, action: 'auth.register', entityType: 'User', entityId: user.id, req });
  await sendTemplate(user.email, 'welcome', { firstName: user.firstName });

  const { token, expiresAt } = await createSession(user, req);
  const res = json({ user: { id: user.id, firstName: user.firstName, role: user.role } }, { status: 201 });
  setSessionCookie(res, token, expiresAt);
  return res;
});
