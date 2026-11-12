import { prisma } from '@/lib/prisma';
import { route, json, ApiError, notFound } from '@/lib/http';
import { requireUser } from '@/lib/rbac';
import { loadApplicationFor, APPLICANT_UPLOAD_STATES } from '@/lib/applications';
import { inspectFile, newStorageKey, readUploadedFile } from '@/lib/uploads';
import { getStorage } from '@/lib/storage';
import { enforceRateLimit } from '@/lib/rate-limit';
import { audit } from '@/lib/audit';

const ADDITIONAL = 'ADDITIONAL';
const ADDITIONAL_RULE = {
  docType: ADDITIONAL,
  label: 'Additional document',
  acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMb: 4,
};
const MAX_ADDITIONAL = 10;

/**
 * Upload (or replace) one document. The file is validated by content, stored
 * under a random key in private storage, and only metadata is returned.
 */
export const POST = route(async (req, { params }) => {
  const user = await requireUser(req);
  await enforceRateLimit(req, 'upload', { limit: 60, windowSeconds: 3600, key: user.id });
  const app = await loadApplicationFor(user, params.id);
  if (app.applicantId !== user.id) throw notFound('Application not found');
  if (!APPLICANT_UPLOAD_STATES.has(app.status)) {
    throw new ApiError(409, 'Documents can no longer be changed for this application');
  }

  const { buffer, filename, form } = await readUploadedFile(req);
  const docType = String(form.get('docType') || '').slice(0, 60);

  const rule =
    docType === ADDITIONAL
      ? ADDITIONAL_RULE
      : await prisma.documentRequirement.findUnique({
          where: { categoryId_docType: { categoryId: app.categoryId, docType } },
        });
  if (!rule) throw new ApiError(400, 'Unknown document type for this application');

  const info = inspectFile(buffer, { acceptedMime: rule.acceptedMime, maxBytes: rule.maxSizeMb * 1024 * 1024 });

  if (docType === ADDITIONAL) {
    const count = await prisma.document.count({ where: { applicationId: app.id, docType, status: 'ACTIVE' } });
    if (count >= MAX_ADDITIONAL) throw new ApiError(400, `You can upload up to ${MAX_ADDITIONAL} additional documents`);
  }

  const storage = getStorage();
  const storageKey = newStorageKey(`applications/${app.id}`, info.ext);
  await storage.put(storageKey, buffer, info.mime);

  let previous = [];
  try {
    const doc = await prisma.$transaction(async (tx) => {
      if (docType !== ADDITIONAL) {
        previous = await tx.document.findMany({ where: { applicationId: app.id, docType, status: 'ACTIVE' } });
        await tx.document.updateMany({
          where: { id: { in: previous.map((p) => p.id) } },
          data: { status: app.status === 'DRAFT' ? 'DELETED' : 'REPLACED' },
        });
      }
      return tx.document.create({
        data: {
          applicationId: app.id,
          uploadedById: user.id,
          docType,
          originalName: filename,
          storageKey,
          mimeType: info.mime,
          sizeBytes: buffer.length,
          sha256: info.sha256,
        },
        select: { id: true, docType: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true },
      });
    });
    // Drafts: physically remove superseded files. Submitted apps keep history for review.
    if (app.status === 'DRAFT') {
      for (const p of previous) await storage.remove(p.storageKey).catch(() => {});
    }
    await audit({ actor: user, action: 'document.uploaded', entityType: 'Document', entityId: doc.id, metadata: { applicationId: app.id, docType }, req });
    return json({ document: doc }, { status: 201 });
  } catch (err) {
    await storage.remove(storageKey).catch(() => {});
    throw err;
  }
});
