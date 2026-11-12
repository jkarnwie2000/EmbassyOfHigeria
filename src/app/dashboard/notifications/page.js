import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/auth/current-user';
import { formatDateTime } from '@/lib/content';
import { EmptyState } from '@/components/ui';
import MarkAllRead from '@/components/applications/MarkAllRead';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requirePageUser('/dashboard/notifications');
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  const unread = items.some((n) => !n.readAt);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        {unread && <MarkAllRead />}
      </div>
      {items.length === 0 ? <div className="mt-6"><EmptyState title="No notifications" /></div> : (
        <ul className="mt-6 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {items.map((n) => (
            <li key={n.id} className={`p-4 ${n.readAt ? '' : 'border-l-4 border-l-primary-600 bg-primary-50/50'}`}>
              <p className="font-semibold">{!n.readAt && <span className="sr-only">Unread: </span>}{n.title}</p>
              <p className="mt-1 text-sm text-slate-800">{n.body}</p>
              <p className="mt-1 text-xs text-slate-600">{formatDateTime(n.createdAt)} {n.link && <> · <Link href={n.link}>View</Link></>}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
