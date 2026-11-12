import { route, json } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { cancelCheckout } from '@/lib/payments';

export const POST = route(async (req, { params }) => {
  const user = await requireUser(req);
  await cancelCheckout(user, String(params.id).slice(0, 40));
  return json({ ok: true });
});
