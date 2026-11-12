import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { announcementFields } from '@/lib/forms/admin-fields';
import ResourceForm from '@/components/admin/ResourceForm';

export const metadata = { title: 'Edit announcement' };

export default async function EditAnnouncement({ params }) {
  const { id } = await params;
  await requirePageStaff(PERMISSIONS.CONTENT_MANAGE, `/admin/news/${id}`);
  const [item, departments] = await Promise.all([
    prisma.announcement.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!item) notFound();
  return (
    <div>
      <p><Link href="/admin/news">← News &amp; announcements</Link></p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Edit announcement</h1>
        {item.published && <Link href={`/news/${item.slug}`} target="_blank" className="btn-secondary btn-sm">View public page</Link>}
      </div>
      <div className="card mt-6">
        <ResourceForm
          endpoint={`/api/admin/announcements/${item.id}`}
          method="PATCH"
          fields={announcementFields(departments)}
          defaults={item}
          deleteEndpoint={`/api/admin/announcements/${item.id}`}
          deleteRedirect="/admin/news"
        />
      </div>
    </div>
  );
}
