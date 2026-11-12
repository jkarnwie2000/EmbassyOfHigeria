import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { route, readJson, json, ApiError, notFound } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { loadApplicationFor, saveDraft } from '@/lib/applications';
import { draftSchema } from '@/lib/validation/common';
import { computeFees } from '@/lib/fees';
import { getStorage } from '@/lib/storage';
import { audit } from '@/lib/audit';

const docSelect = { id: true, docType: true, originalName: true, mimeType: true, sizeBytes: true, status: true, createdAt: true };

export const GET = route(async (req, { params }) => {
  const user = await requireUser(req);
  const app = await loadApplicationFor(user, params.id, {
    category: { include: { requirements: { orderBy: { sortOrder: 'asc' } } } },
    documents: { where: { status: 'ACTIVE' }, select: docSelect, orderBy: { createdAt: 'asc' } },
  });
  if (app.applicantId !== user.id) throw notFound('Application not found'); // staff use admin endpoints
  const fees = await computeFees(app.categoryId);
  return json({ application: app, fees });
});

export const PATCH = route(async (req, { params }) => {
  const user = await requireUser(req);
  const app = await loadApplicationFor(user, params.id);
  const { formData } = await readJson(req, z.object({ formData: draftSchema }));
  const saved = await saveDraft(user, app, formData);
  return json({ ok: true, updatedAt: saved.updatedAt });
});

export const DELETE = route(async (req, { params }) => {
  const user = await requireUser(req);
  const app = await loadApplicationFor(user, params.id, { documents: true });
  if (app.applicantId !== user.id) throw notFound('Application not found');
  if (app.status !== 'DRAFT') throw new ApiError(409, 'Only draft applications can be deleted');
  const storage = getStorage();
  for (const doc of app.documents) await storage.remove(doc.storageKey).catch(() => {});
  await prisma.application.delete({ where: { id: app.id } });
  await audit({ actor: user, action: 'application.draft_deleted', entityType: 'Application', entityId: app.id, req });
  return json({ ok: true });
});
