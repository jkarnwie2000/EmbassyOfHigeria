import { prisma } from '@/lib/prisma';
import { route, readJson, json, notFound } from '@/lib/http';
import { requireStaff, inquiryScope, PERMISSIONS } from '@/lib/rbac';
import { inquiryUpdateSchema } from '@/lib/validation/admin';
import { audit } from '@/lib/audit';

export const PATCH = route(async (req, { params }) => {
  const actor = await requireStaff(req, PERMISSIONS.INQUIRIES_MANAGE);
  const inquiry = await prisma.contactInquiry.findFirst({ where: { id: params.id, ...inquiryScope(actor) } });
  if (!inquiry) throw notFound('Inquiry not found');
  const data = await readJson(req, inquiryUpdateSchema);
  const record = await prisma.contactInquiry.update({ where: { id: inquiry.id }, data });
  await audit({ actor, action: 'inquiry.updated', entityType: 'ContactInquiry', entityId: inquiry.id, metadata: data.status ? { status: data.status } : undefined, req });
  return json({ record });
});
