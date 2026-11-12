import { prisma } from '@/lib/prisma';
import { route, json, ApiError, notFound } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { loadApplicationFor } from '@/lib/applications';
import { getStorage } from '@/lib/storage';
import { audit } from '@/lib/audit';

export const DELETE = route(async (req, { params }) => {
  const user = await requireUser(req);
  const app = await loadApplicationFor(user, params.id);
  if (app.applicantId !== user.id) throw notFound('Application not found');
  if (app.status !== 'DRAFT') throw new ApiError(409, 'Documents can only be removed from draft applications');
  const doc = await prisma.document.findFirst({ where: { id: params.docId, applicationId: app.id, status: 'ACTIVE' } });
  if (!doc) throw notFound('Document not found');
  await prisma.document.update({ where: { id: doc.id }, data: { status: 'DELETED' } });
  await getStorage().remove(doc.storageKey).catch(() => {});
  await audit({ actor: user, action: 'document.deleted', entityType: 'Document', entityId: doc.id, req });
  return json({ ok: true });
});
