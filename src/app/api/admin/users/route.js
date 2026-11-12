import { prisma } from '@/lib/prisma';
import { route, readJson, json, forbidden } from '@/lib/http';
import { requireStaff, manageableRoles, PERMISSIONS } from '@/lib/rbac';
import { userCreateSchema } from '@/lib/validation/admin';
import { hashPassword } from '@/lib/auth/password';
import { friendlyDbError } from '@/lib/admin-crud';
import { audit } from '@/lib/audit';

export const POST = route(async (req) => {
  const actor = await requireStaff(req, PERMISSIONS.USERS_MANAGE);
  const data = await readJson(req, userCreateSchema);
  if (!manageableRoles(actor).includes(data.role)) throw forbidden('You cannot create accounts with this role');
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        permissions: data.role === 'STAFF' ? data.permissions : [],
        passwordHash: await hashPassword(data.password),
        departments: { create: data.departmentIds.map((departmentId) => ({ departmentId })) },
      },
      select: { id: true, email: true, role: true },
    });
    await audit({ actor, action: 'user.created', entityType: 'User', entityId: user.id, metadata: { role: data.role, permissions: data.permissions }, req });
    return json({ user }, { status: 201 });
  } catch (err) {
    throw friendlyDbError(err);
  }
});
