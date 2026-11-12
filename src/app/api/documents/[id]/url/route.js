import { prisma } from '@/lib/prisma';
import { route, json, notFound } from '@/lib/http';
import { requireUser, hasPermission, isStaff, canAccessApplicationType, PERMISSIONS } from '@/lib/rbac';
import { getStorage } from '@/lib/storage';
import { audit } from '@/lib/audit';

/**
 * Returns a link to a private document that expires after 5 minutes.
 * Applicants: own documents only. Staff: requires applications.view and department scope.
 */
export const GET = route(async (req, { params }) => {
  const user = await requireUser(req);
  const doc = await prisma.document.findUnique({
    where: { id: String(params.id).slice(0, 40) },
    include: { application: { select: { applicantId: true, type: true } } },
  });
  if (!doc || doc.status === 'DELETED') throw notFound('Document not found');

  const isOwner = doc.application.applicantId === user.id;
  const staffAllowed =
    isStaff(user) && hasPermission(user, PERMISSIONS.APPLICATIONS_VIEW) && canAccessApplicationType(user, doc.application.type);
  if (!isOwner && !staffAllowed) throw notFound('Document not found');

  const inline = new URL(req.url).searchParams.get('inline') === '1';
  const url = await getStorage().signedUrl(doc.storageKey, {
    expiresIn: 300,
    filename: doc.originalName,
    contentType: doc.mimeType,
    inline,
  });
  await audit({
    actor: user,
    action: isOwner ? 'document.accessed_by_owner' : 'document.accessed_by_staff',
    entityType: 'Document',
    entityId: doc.id,
    metadata: { applicationId: doc.applicationId },
    req,
  });
  return json({ url, expiresIn: 300 });
});
