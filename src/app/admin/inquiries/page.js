import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { inquiryScope, PERMISSIONS } from '@/lib/rbac';
import { formatDateTime } from '@/lib/content';
import { StatusBadge, EmptyState, STATUS_TEXT } from '@/components/ui';
import InquiryUpdateForm from '@/components/admin/InquiryUpdateForm';

export const metadata = { title: 'Inquiries' };
const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default async function AdminInquiries({ searchParams }) {
  const sp = await searchParams;
  const user = await requirePageStaff(PERMISSIONS.INQUIRIES_MANAGE, '/admin/inquiries');
  const status = STATUSES.includes(sp.status) ? sp.status : undefined;
  const items = await prisma.contactInquiry.findMany({
    where: { ...inquiryScope(user), ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { department: { select: { name: true } } },
  });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Contact inquiries</h1>
      <nav aria-label="Filter inquiries" className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/inquiries" aria-current={!status ? 'page' : undefined} className={`btn btn-sm ${!status ? 'bg-primary-700 text-white' : 'btn-secondary'}`}>All</Link>
        {STATUSES.map((s) => <Link key={s} href={`/admin/inquiries?status=${s}`} aria-current={status === s ? 'page' : undefined} className={`btn btn-sm ${status === s ? 'bg-primary-700 text-white' : 'btn-secondary'}`}>{STATUS_TEXT[s]}</Link>)}
      </nav>
      {items.length === 0 ? <div className="mt-6"><EmptyState title="No inquiries" /></div> : (
        <ul className="mt-6 space-y-3">
          {items.map((i) => (
            <li key={i.id}>
              <details className="card">
                <summary className="cursor-pointer">
                  <span className="font-semibold text-primary-800">{i.subject}</span> <StatusBadge status={i.status} />
                  <span className="block text-xs text-slate-600">{i.name} · {i.department?.name || 'General'} · {formatDateTime(i.createdAt)}</span>
                </summary>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
                  <dt className="font-semibold">Email</dt><dd><a href={`mailto:${i.email}`}>{i.email}</a></dd>
                  <dt className="font-semibold">Phone</dt><dd>{i.phone || '—'}</dd>
                  <dt className="font-semibold">Message</dt><dd className="whitespace-pre-line">{i.message}</dd>
                </dl>
                <div className="mt-4 border-t border-slate-200 pt-4"><InquiryUpdateForm id={i.id} status={i.status} note={i.internalNote || ''} /></div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
