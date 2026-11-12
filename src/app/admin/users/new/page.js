import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS, PERMISSION_LABELS, manageableRoles } from '@/lib/rbac';
import ResourceForm from '@/components/admin/ResourceForm';

export const metadata = { title: 'Add staff account' };

export default async function NewUser() {
  const actor = await requirePageStaff(PERMISSIONS.USERS_MANAGE, '/admin/users/new');
  const departments = await prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } });
  const fields = [
    { name: 'firstName', label: 'First name', required: true },
    { name: 'lastName', label: 'Last name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'role', label: 'Role', type: 'select', nullable: false, options: manageableRoles(actor).map((r) => ({ value: r, label: r.replace('_', ' ') })) },
    { name: 'password', label: 'Temporary password', type: 'password', required: true, hint: '12+ characters with upper-case, lower-case and a number. Share it securely and ask the user to change it.' },
    { name: 'departmentIds', label: 'Assigned offices', type: 'checkboxes', options: departments.map((d) => ({ value: d.id, label: d.name })) },
    { name: 'permissions', label: 'Permissions (STAFF role only — administrators have all permissions)', type: 'checkboxes', options: Object.entries(PERMISSION_LABELS).map(([value, label]) => ({ value, label })) },
  ];
  return (
    <div>
      <p><Link href="/admin/users">← Staff accounts</Link></p>
      <h1 className="mt-2 text-3xl font-semibold">Add staff account</h1>
      <div className="card mt-6">
        <ResourceForm endpoint="/api/admin/users" fields={fields} defaults={{ role: 'STAFF', permissions: ['applications.view'] }} submitLabel="Create account" redirectTo="/admin/users" />
      </div>
    </div>
  );
}
