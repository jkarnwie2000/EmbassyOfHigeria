import { route, json } from '@/lib/http';
import { getSessionUser } from '@/lib/auth/session';

export const GET = route(async (req) => {
  const user = await getSessionUser(req);
  if (!user) return json({ user: null });
  const { id, firstName, lastName, email, role } = user;
  return json({ user: { id, firstName, lastName, email, role } });
});
