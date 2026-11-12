import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { ANNOUNCEMENT_LABELS, formatDateTime } from '@/lib/content';

export const metadata = { title: 'News & announcements' };

export default async function AdminNews() {
  await requirePageStaff(PERMISSIONS.CONTENT_MANAGE, '/admin/news');
  const items = await prisma.announcement.findMany({ orderBy: [{ publishedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }] });
  const now = new Date();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">News &amp; announcements</h1>
        <Link href="/admin/news/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> New announcement</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th scope="col">Title</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Publication date</th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/news/${a.id}`} className="font-semibold">{a.title}</Link>{a.important && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-950">Homepage notice</span>}</td>
                <td>{ANNOUNCEMENT_LABELS[a.category]}</td>
                <td>{!a.published ? 'Draft' : a.publishedAt > now ? 'Scheduled' : 'Published'}</td>
                <td className="whitespace-nowrap">{formatDateTime(a.publishedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
