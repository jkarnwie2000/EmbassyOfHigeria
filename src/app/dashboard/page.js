import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/auth/current-user';
import { formatDate } from '@/lib/content';
import { StatusBadge, EmptyState, Alert } from '@/components/ui';

const NEXT_STEP = {
  DRAFT: 'Continue your application',
  PAYMENT_PENDING: 'Payment required',
  ADDITIONAL_DOCUMENTS_REQUIRED: 'Upload requested documents',
};

export default async function DashboardPage() {
  const user = await requirePageUser();
  const [apps, notifications] = await Promise.all([
    prisma.application.findMany({ where: { applicantId: user.id }, orderBy: { updatedAt: 'desc' }, include: { category: { select: { name: true } } } }),
    prisma.notification.findMany({ where: { userId: user.id, readAt: null }, orderBy: { createdAt: 'desc' }, take: 3 }),
  ]);
  const actionable = apps.filter((a) => NEXT_STEP[a.status]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Welcome, {user.firstName}</h1>
          <p className="mt-1 text-slate-700">Manage your applications, payments and documents.</p>
        </div>
        <Link href="/dashboard/applications/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Start a new application</Link>
      </div>

      {actionable.length > 0 && (
        <Alert type="warning" title="Action needed">
          <ul className="space-y-1">
            {actionable.map((a) => (
              <li key={a.id}><Link href={`/dashboard/applications/${a.id}`} className="font-semibold text-amber-950 underline">{NEXT_STEP[a.status]}</Link> — {a.category.name} {a.referenceNumber && `(${a.referenceNumber})`}</li>
            ))}
          </ul>
        </Alert>
      )}

      {notifications.length > 0 && (
        <section className="card" aria-labelledby="notif-h">
          <div className="flex items-center justify-between">
            <h2 id="notif-h" className="text-lg font-semibold">Recent notifications</h2>
            <Link href="/dashboard/notifications" className="text-sm font-semibold">View all</Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id} className="py-2 text-sm"><strong>{n.title}</strong> — {n.body}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="apps-h">
        <h2 id="apps-h" className="text-2xl font-semibold">My applications</h2>
        {apps.length === 0 ? (
          <div className="mt-4"><EmptyState title="You have no applications yet">Start a <Link href="/services/passport">passport</Link> or <Link href="/services/visa">visa</Link> application.</EmptyState></div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white">
            <table className="table">
              <caption className="sr-only">Your applications</caption>
              <thead><tr><th scope="col">Application</th><th scope="col">Reference</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.category.name}</td>
                    <td className="font-mono text-xs">{a.referenceNumber || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="whitespace-nowrap">{formatDate(a.updatedAt)}</td>
                    <td><Link href={`/dashboard/applications/${a.id}`} className="inline-flex items-center gap-1 font-semibold">{a.status === 'DRAFT' ? 'Continue' : 'View'}<span className="sr-only"> {a.category.name}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
