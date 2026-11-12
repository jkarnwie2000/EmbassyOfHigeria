import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { departmentFields } from '@/lib/forms/admin-fields';
import ResourceForm from '@/components/admin/ResourceForm';

export const metadata = { title: 'Edit office' };

export default async function EditOffice({ params }) {
  const { id } = await params;
  await requirePageStaff(PERMISSIONS.OFFICES_MANAGE, `/admin/offices/${id}`);
  const office = await prisma.department.findUnique({ where: { id } });
  if (!office) notFound();
  return (
    <div>
      <p><Link href="/admin/offices">← Offices</Link></p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{office.name}</h1>
        <Link href={`/offices/${office.slug}`} className="btn-secondary btn-sm" target="_blank">View public page</Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">Office announcements are managed under <Link href="/admin/news">News &amp; announcements</Link>; FAQs under <Link href="/admin/faqs">FAQs</Link>.</p>
      <div className="card mt-6">
        <ResourceForm
          endpoint={`/api/admin/departments/${office.id}`}
          method="PATCH"
          fields={departmentFields}
          defaults={office}
          deleteEndpoint={`/api/admin/departments/${office.id}`}
          deleteLabel="Delete office"
          deleteRedirect="/admin/offices"
        />
      </div>
    </div>
  );
}
