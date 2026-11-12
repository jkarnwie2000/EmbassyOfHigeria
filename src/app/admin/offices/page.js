import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';

export const metadata = { title: 'Offices' };

export default async function AdminOffices() {
  await requirePageStaff(PERMISSIONS.OFFICES_MANAGE, '/admin/offices');
  const offices = await prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { staff: true, faqs: true } } } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Embassy offices</h1>
        <Link href="/admin/offices/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Add office</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th scope="col">Office</th><th scope="col">Processes</th><th scope="col">Staff</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {offices.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/offices/${o.id}`} className="font-semibold">{o.name}</Link><br /><span className="text-xs text-slate-600">/offices/{o.slug}</span></td>
                <td>{o.handlesType ? (o.handlesType === 'PASSPORT' ? 'Passports' : 'Visas') : '—'}</td>
                <td>{o._count.staff}</td>
                <td className="text-xs">{o.active ? 'Visible' : 'Hidden'}{o.isPlaceholder && <span className="block text-amber-800">Placeholder info</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
