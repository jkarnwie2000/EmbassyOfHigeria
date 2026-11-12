import { prisma } from '@/lib/prisma';
import { route, readJson, json, forbidden, notFound, ApiError } from '@/lib/http';
import { requireStaff, manageableRoles, PERMISSIONS } from '@/lib/rbac';
import { userUpdateSchema } from '@/lib/validation/admin';
import { hashPassword } from '@/lib/auth/password';
import { revokeAllSessions } from '@/lib/auth/session';
import { audit } from '@/lib/audit';

export const PATCH = route(async (req, { params }) => {
  const actor = await requireStaff(req, PERMISSIONS.USERS_MANAGE);
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.role === 'APPLICANT') throw notFound('Staff account not found');
  const allowed = manageableRoles(actor);
  if (!allowed.includes(target.role)) throw forbidden('You cannot manage this account');
  if (target.id === actor.id) throw new ApiError(400, 'You cannot change your own role, permissions or status');

  const data = await readJson(req, userUpdateSchema);
  if (data.role && !allowed.includes(data.role)) throw forbidden('You cannot assign this role');

  const role = data.role ?? target.role;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: {
        role,
        ...(data.permissions ? { permissions: role === 'STAFF' ? data.permissions : [] } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.password ? { passwordHash: await hashPassword(data.password), failedLoginCount: 0, lockedUntil: null } : {}),
      },
    });
    if (data.departmentIds) {
      await tx.staffDepartment.deleteMany({ where: { userId: target.id } });
      await tx.staffDepartment.createMany({ data: data.departmentIds.map((departmentId) => ({ userId: target.id, departmentId })) });
    }
  });
  // Any change to access rights or credentials forces re-authentication
  await revokeAllSessions(target.id);
  await audit({
    actor,
    action: 'user.updated',
    entityType: 'User',
    entityId: target.id,
    metadata: { role, active: data.active, permissions: data.permissions, departments: data.departmentIds, passwordReset: !!data.password },
    req,
  });
  return json({ ok: true });
});
