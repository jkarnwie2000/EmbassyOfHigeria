import { route, json } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { loadApplicationFor, resubmitDocuments } from '@/lib/applications';
import { audit } from '@/lib/audit';

/** Applicant confirms requested documents have been uploaded; returns to review. */
export const POST = route(async (req, { params }) => {
  const user = await requireUser(req);
  const app = await loadApplicationFor(user, params.id);
  const updated = await resubmitDocuments(user, app);
  await audit({ actor: user, action: 'application.documents_resubmitted', entityType: 'Application', entityId: app.id, req });
  return json({ application: { id: updated.id, status: updated.status } });
});
