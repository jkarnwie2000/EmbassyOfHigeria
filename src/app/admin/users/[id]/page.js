import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS, PERMISSION_LABELS, manageableRoles } from '@/lib/rbac';
import { formatDateTime } from '@/lib/content';
import UserEditForm from '@/components/admin/UserEditForm';
import { Alert } from '@/components/ui';

export const metadata = { title: 'Edit staff account' };

export default async function EditUser({ params }) {
  const { id } = await params;
  const actor = await requirePageStaff(PERMISSIONS.USERS_MANAGE, `/admin/users/${id}`);
  const [user, departments, activity] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { departments: true } }),
    prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.auditLog.findMany({ where: { actorId: id }, orderBy: { createdAt: 'desc' }, take: 25 }),
  ]);
  if (!user || user.role === 'APPLICANT') notFound();
  const roles = manageableRoles(actor);
  const editable = roles.includes(user.role) && user.id !== actor.id;

  const fields = [
    { name: 'role', label: 'Role', type: 'select', nullable: false, options: roles.map((r) => ({ value: r, label: r.replace('_', ' ') })) },
    { name: 'active', label: 'Account active', type: 'checkbox' },
    { name: 'departmentIds', label: 'Assigned offices', type: 'checkboxes', options: departments.map((d) => ({ value: d.id, label: d.name })) },
    { name: 'permissions', label: 'Permissions (STAFF role only)', type: 'checkboxes', options: Object.entries(PERMISSION_LABELS).map(([value, label]) => ({ value, label })) },
    { name: 'password', label: 'Reset password (leave blank to keep)', type: 'password', hint: 'Saving signs the user out of all sessions.' },
  ];

  return (
    <div className="space-y-6">
      <p><Link href="/admin/users">← Staff accounts</Link></p>
      <div>
        <h1 className="text-3xl font-semibold">{user.firstName} {user.lastName}</h1>
        <p className="text-sm text-slate-600">{user.email} · Last sign-in {formatDateTime(user.lastLoginAt) || 'never'}</p>
      </div>
      {editable ? (
        <div className="card">
          {/* Only explicit, non-secret fields are sent to the browser (never passwordHash). */}
          <UserEditForm
            userId={user.id}
            fields={fields}
            defaults={{ role: user.role, active: user.active, permissions: user.permissions, departmentIds: user.departments.map((d) => d.departmentId), password: '' }}
          />
        </div>
      ) : (
        <Alert type="info">{user.id === actor.id ? 'You cannot change your own role or access.' : 'You do not have authority to manage this account.'}</Alert>
      )}
      <section className="card" aria-labelledby="act-h">
        <h2 id="act-h" className="text-lg font-semibold">Recent activity</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {activity.map((a) => <li key={a.id}><span className="font-mono text-xs">{formatDateTime(a.createdAt)}</span> — {a.action}{a.entityType && ` (${a.entityType})`}</li>)}
          {activity.length === 0 && <li className="text-slate-600">No activity recorded.</li>}
        </ul>
      </section>
    </div>
  );
}
