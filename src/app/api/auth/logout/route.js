import { route, json } from '@/lib/http';
import { destroySession, clearSessionCookie, getSessionUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';

export const POST = route(async (req) => {
  const user = await getSessionUser(req);
  await destroySession(req);
  if (user) await audit({ actor: user, action: 'auth.logout', entityType: 'User', entityId: user.id, req });
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
});
