import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { formatDateTime } from '@/lib/content';

export const metadata = { title: 'Staff accounts' };

export default async function AdminUsers() {
  await requirePageStaff(PERMISSIONS.USERS_MANAGE, '/admin/users');
  const users = await prisma.user.findMany({
    where: { role: { not: 'APPLICANT' } },
    orderBy: [{ role: 'desc' }, { lastName: 'asc' }],
    include: { departments: { include: { department: { select: { name: true } } } } },
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Staff accounts</h1>
        <Link href="/admin/users/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Add staff account</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Offices</th><th scope="col">Last sign-in</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/admin/users/${u.id}`} className="font-semibold">{u.firstName} {u.lastName}</Link><br /><span className="text-xs text-slate-600">{u.email}</span></td>
                <td className="text-xs">{u.role.replace('_', ' ')}</td>
                <td className="text-xs">{u.departments.map((d) => d.department.name).join(', ') || '—'}</td>
                <td className="whitespace-nowrap text-xs">{formatDateTime(u.lastLoginAt) || 'Never'}</td>
                <td className="text-xs">{u.active ? 'Active' : 'Disabled'}{u.lockedUntil && u.lockedUntil > new Date() && <span className="block text-accent-700">Locked</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
