import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { applicationScope, hasPermission, PERMISSIONS } from '@/lib/rbac';
import { formatMoney } from '@/lib/fees';
import { formatDateTime } from '@/lib/content';
import { StatusBadge, Alert } from '@/components/ui';

export const metadata = { title: 'Overview' };

function Stat({ label, value, href }) {
  const inner = (
    <>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-primary-800">{value}</p>
    </>
  );
  return href ? <Link href={href} className="card block no-underline hover:border-primary-400">{inner}</Link> : <div className="card">{inner}</div>;
}

export default async function AdminOverview({ searchParams }) {
  const sp = await searchParams;
  const user = await requirePageStaff();
  const canApps = hasPermission(user, PERMISSIONS.APPLICATIONS_VIEW);
  const canPay = hasPermission(user, PERMISSIONS.PAYMENTS_VIEW);
  const scope = applicationScope(user);
  const notDraft = { ...scope, status: { not: 'DRAFT' } };

  const [total, pending, approved, rejected, completed, paid, recent, newInquiries] = await Promise.all([
    canApps ? prisma.application.count({ where: notDraft }) : 0,
    canApps ? prisma.application.count({ where: { ...scope, status: { in: ['SUBMITTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED'] } } }) : 0,
    canApps ? prisma.application.count({ where: { ...scope, status: 'APPROVED' } }) : 0,
    canApps ? prisma.application.count({ where: { ...scope, status: 'REJECTED' } }) : 0,
    canApps ? prisma.application.count({ where: { ...scope, status: 'COMPLETED' } }) : 0,
    canPay ? prisma.payment.aggregate({ where: { status: 'SUCCEEDED', application: scope }, _sum: { amountCents: true }, _count: true }) : null,
    canApps ? prisma.application.findMany({ where: notDraft, orderBy: { submittedAt: 'desc' }, take: 8, include: { category: { select: { name: true } } } }) : [],
    hasPermission(user, PERMISSIONS.INQUIRIES_MANAGE) ? prisma.contactInquiry.count({ where: { status: 'NEW' } }) : 0,
  ]);

  return (
    <div className="space-y-8">
      {sp.denied && <Alert type="error">You do not have permission to access that page.</Alert>}
      <div>
        <h1 className="text-3xl font-semibold">Overview</h1>
        <p className="mt-1 text-slate-700">Welcome, {user.firstName}.{user.role === 'STAFF' && user.departments.length > 0 && <> Your offices: {user.departments.map((d) => d.name).join(', ')}.</>}</p>
      </div>
      {canApps && (
        <section aria-labelledby="stats-h">
          <h2 id="stats-h" className="sr-only">Application statistics</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Stat label="Total applications" value={total} href="/admin/applications" />
            <Stat label="Pending" value={pending} href="/admin/applications?status=PENDING" />
            <Stat label="Approved" value={approved} href="/admin/applications?status=APPROVED" />
            <Stat label="Rejected" value={rejected} href="/admin/applications?status=REJECTED" />
            <Stat label="Completed" value={completed} href="/admin/applications?status=COMPLETED" />
            {canPay && <Stat label={`Payments received (${paid?._count ?? 0})`} value={formatMoney(paid?._sum.amountCents || 0)} href="/admin/payments" />}
          </div>
        </section>
      )}
      {newInquiries > 0 && <Alert type="info"><Link href="/admin/inquiries?status=NEW">{newInquiries} new inquir{newInquiries === 1 ? 'y' : 'ies'}</Link> awaiting a response.</Alert>}
      {canApps && (
        <section aria-labelledby="recent-h">
          <h2 id="recent-h" className="text-2xl font-semibold">Recent submissions</h2>
          <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white">
            <table className="table">
              <thead><tr><th scope="col">Reference</th><th scope="col">Applicant</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Submitted</th></tr></thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td><Link href={`/admin/applications/${a.id}`} className="font-mono text-xs font-semibold">{a.referenceNumber}</Link></td>
                    <td>{a.firstName} {a.lastName}</td>
                    <td>{a.category.name}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="whitespace-nowrap">{formatDateTime(a.submittedAt)}</td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={5} className="text-slate-600">No submissions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
