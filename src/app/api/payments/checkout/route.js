import { z } from 'zod';
import { route, readJson, json } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { loadApplicationFor } from '@/lib/applications';
import { createCheckout } from '@/lib/payments';
import { enforceRateLimit } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';

export const POST = route(async (req) => {
  const user = await requireUser(req);
  await enforceRateLimit(req, 'checkout', { limit: 15, windowSeconds: 3600, key: user.id });
  // Only the application id is accepted from the client — never an amount.
  const { applicationId } = await readJson(req, z.object({ applicationId: z.string().min(1).max(40) }));
  const app = await loadApplicationFor(user, applicationId);
  const { url, paymentId } = await createCheckout(user, app);
  await audit({ actor: user, action: 'payment.checkout_started', entityType: 'Payment', entityId: paymentId, req });
  return json({ url });
});
