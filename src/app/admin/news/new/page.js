import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { announcementFields } from '@/lib/forms/admin-fields';
import ResourceForm from '@/components/admin/ResourceForm';

export const metadata = { title: 'New announcement' };

export default async function NewAnnouncement() {
  await requirePageStaff(PERMISSIONS.CONTENT_MANAGE, '/admin/news/new');
  const departments = await prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } });
  return (
    <div>
      <p><Link href="/admin/news">← News &amp; announcements</Link></p>
      <h1 className="mt-2 text-3xl font-semibold">New announcement</h1>
      <div className="card mt-6">
        <ResourceForm endpoint="/api/admin/announcements" fields={announcementFields(departments)} defaults={{ category: 'EMBASSY_NEWS', published: false }} submitLabel="Create announcement" redirectTo="/admin/news/{id}" />
      </div>
    </div>
  );
}
