import { route, json } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { loadApplicationFor, submitApplication } from '@/lib/applications';
import { enforceRateLimit } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';

export const POST = route(async (req, { params }) => {
  const user = await requireUser(req);
  await enforceRateLimit(req, 'app-submit', { limit: 20, windowSeconds: 3600, key: user.id });
  const app = await loadApplicationFor(user, params.id);
  const { application, fees } = await submitApplication(user, app);
  await audit({
    actor: user,
    action: 'application.submitted',
    entityType: 'Application',
    entityId: application.id,
    metadata: { reference: application.referenceNumber },
    req,
  });
  return json({
    application: { id: application.id, referenceNumber: application.referenceNumber, status: application.status },
    amountDueCents: fees.totalCents,
  });
});
