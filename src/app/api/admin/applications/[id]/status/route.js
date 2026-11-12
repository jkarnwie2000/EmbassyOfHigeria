import { route, readJson, json } from '@/lib/http';
import { requireStaff, PERMISSIONS } from '@/lib/rbac';
import { loadApplicationFor, changeStatus } from '@/lib/applications';
import { statusUpdateSchema } from '@/lib/validation/admin';
import { audit } from '@/lib/audit';

export const PATCH = route(async (req, { params }) => {
  const actor = await requireStaff(req, PERMISSIONS.APPLICATIONS_REVIEW);
  const app = await loadApplicationFor(actor, params.id);
  const { status, publicNote } = await readJson(req, statusUpdateSchema);
  const updated = await changeStatus(actor, app, status, publicNote);
  await audit({
    actor,
    action: 'application.status_changed',
    entityType: 'Application',
    entityId: app.id,
    metadata: { from: app.status, to: status },
    req,
  });
  return json({ application: { id: updated.id, status: updated.status } });
});
