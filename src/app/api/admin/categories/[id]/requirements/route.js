import { prisma } from '@/lib/prisma';
import { route, readJson, json, notFound } from '@/lib/http';
import { requireStaff, PERMISSIONS } from '@/lib/rbac';
import { requirementSchema } from '@/lib/validation/admin';
import { friendlyDbError } from '@/lib/admin-crud';
import { audit } from '@/lib/audit';

export const POST = route(async (req, { params }) => {
  const actor = await requireStaff(req, PERMISSIONS.SERVICES_MANAGE);
  const category = await prisma.applicationCategory.findUnique({ where: { id: params.id } });
  if (!category) throw notFound('Category not found');
  const data = await readJson(req, requirementSchema);
  try {
    const record = await prisma.documentRequirement.create({ data: { ...data, categoryId: category.id } });
    await audit({ actor, action: 'DocumentRequirement.created', entityType: 'DocumentRequirement', entityId: record.id, req });
    return json({ record }, { status: 201 });
  } catch (err) {
    throw friendlyDbError(err);
  }
});
