import Link from 'next/link';
import { Download } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { applicationScope, PERMISSIONS } from '@/lib/rbac';
import { formatMoney } from '@/lib/fees';
import { formatDateTime } from '@/lib/content';
import { StatusBadge, STATUS_TEXT } from '@/components/ui';

export const metadata = { title: 'Payments' };
const STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED', 'REFUNDED'];

export default async function AdminPayments({ searchParams }) {
  const sp = await searchParams;
  const user = await requirePageStaff(PERMISSIONS.PAYMENTS_VIEW, '/admin/payments');
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const status = STATUSES.includes(sp.status) ? sp.status : undefined;
  const where = {
    application: applicationScope(user),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { receiptNumber: { contains: q, mode: 'insensitive' } },
            { stripePaymentIntentId: { contains: q } },
            { stripeCheckoutSessionId: { contains: q } },
            { application: { referenceNumber: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
  const [payments, totals] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100, include: { application: { select: { id: true, referenceNumber: true, firstName: true, lastName: true } } } }),
    prisma.payment.groupBy({ by: ['status'], where: { application: applicationScope(user) }, _sum: { amountCents: true }, _count: true }),
  ]);
  const t = Object.fromEntries(totals.map((r) => [r.status, r]));
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Payments</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-600">Successful</p><p className="font-serif text-2xl font-semibold">{formatMoney(t.SUCCEEDED?._sum.amountCents || 0)}</p><p className="text-xs text-slate-600">{t.SUCCEEDED?._count || 0} transactions</p></div>
        <div className="card"><p className="text-sm text-slate-600">Failed</p><p className="font-serif text-2xl font-semibold">{t.FAILED?._count || 0}</p></div>
        <div className="card"><p className="text-sm text-slate-600">Pending</p><p className="font-serif text-2xl font-semibold">{t.PENDING?._count || 0}</p></div>
      </div>

      <form className="card mt-6 grid gap-4 md:grid-cols-3" role="search" aria-label="Search payments">
        <div className="md:col-span-2"><label htmlFor="pq" className="label">Search</label><input id="pq" name="q" defaultValue={q} className="input" placeholder="Receipt, application reference or Stripe ID" /></div>
        <div><label htmlFor="ps" className="label">Status</label><select id="ps" name="status" defaultValue={status || ''} className="input"><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}</select></div>
        <div className="md:col-span-3"><button className="btn-primary" type="submit">Search</button></div>
      </form>

      <form action="/api/admin/payments/report" method="get" className="card mt-4 flex flex-wrap items-end gap-4" aria-label="Download payment report">
        <div><label htmlFor="from" className="label">From</label><input id="from" name="from" type="date" defaultValue={monthAgo} className="input" /></div>
        <div><label htmlFor="to" className="label">To</label><input id="to" name="to" type="date" defaultValue={today} className="input" /></div>
        <div><label htmlFor="rs" className="label">Status</label><select id="rs" name="status" className="input"><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}</select></div>
        <button type="submit" className="btn-secondary"><Download className="h-4 w-4" aria-hidden="true" /> Download CSV report</button>
      </form>

      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th scope="col">Date</th><th scope="col">Application</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Receipt / reference</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">{formatDateTime(p.paidAt || p.createdAt)}</td>
                <td><Link href={`/admin/applications/${p.application.id}`} className="font-mono text-xs">{p.application.referenceNumber}</Link><br /><span className="text-xs">{p.application.firstName} {p.application.lastName}</span></td>
                <td>{formatMoney(p.amountCents, p.currency)}</td>
                <td><StatusBadge status={p.status} />{p.failureReason && <span className="block text-xs text-slate-600">{p.failureReason}</span>}</td>
                <td className="text-xs">{p.receiptNumber ? <a href={`/api/payments/${p.id}/receipt`}>{p.receiptNumber}</a> : '—'}<br /><span className="font-mono text-slate-500">{p.stripePaymentIntentId || p.stripeCheckoutSessionId?.slice(0, 24)}</span></td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={5} className="text-slate-600">No payments found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
