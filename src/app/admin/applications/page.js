import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { applicationScope, PERMISSIONS } from '@/lib/rbac';
import { formatDateTime } from '@/lib/content';
import { StatusBadge, STATUS_TEXT } from '@/components/ui';

export const metadata = { title: 'Applications' };

const STATUSES = ['SUBMITTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED', 'COMPLETED'];
const PENDING = ['SUBMITTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED'];
const PAGE = 25;

export default async function AdminApplications({ searchParams }) {
  const sp = await searchParams;
  const user = await requirePageStaff(PERMISSIONS.APPLICATIONS_VIEW, '/admin/applications');
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const type = ['PASSPORT', 'VISA'].includes(sp.type) ? sp.type : undefined;
  const status = sp.status === 'PENDING' ? { in: PENDING } : STATUSES.includes(sp.status) ? sp.status : { not: 'DRAFT' };
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);

  // Prisma parameterises every value: no SQL injection via search terms.
  const where = {
    AND: [
      applicationScope(user),
      { status },
      type ? { type } : {},
      q
        ? {
            OR: [
              { referenceNumber: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { visaDetails: { passportNumber: { contains: q.toUpperCase() } } },
            ],
          }
        : {},
    ],
  };
  const [apps, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { category: { select: { name: true } }, payments: { where: { status: 'SUCCEEDED' }, select: { id: true } } },
    }),
    prisma.application.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p) => `?${new URLSearchParams({ ...(q && { q }), ...(type && { type }), ...(typeof sp.status === 'string' && sp.status && { status: sp.status }), page: String(p) })}`;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Applications</h1>
      <form className="card mt-6 grid gap-4 md:grid-cols-4" role="search" aria-label="Search applications">
        <div className="md:col-span-2">
          <label htmlFor="q" className="label">Search</label>
          <input id="q" name="q" defaultValue={q} className="input" placeholder="Reference, name, email or passport number" />
        </div>
        <div>
          <label htmlFor="type" className="label">Type</label>
          <select id="type" name="type" defaultValue={type || ''} className="input"><option value="">All</option><option value="PASSPORT">Passport</option><option value="VISA">Visa</option></select>
        </div>
        <div>
          <label htmlFor="status" className="label">Status</label>
          <select id="status" name="status" defaultValue={sp.status || ''} className="input">
            <option value="">All submitted</option>
            <option value="PENDING">All pending</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_TEXT[s]}</option>)}
          </select>
        </div>
        <div className="md:col-span-4"><button className="btn-primary" type="submit">Apply filters</button> <Link href="/admin/applications" className="btn-ghost">Reset</Link></div>
      </form>
      <p className="mt-6 text-sm text-slate-600" role="status">{total} application{total === 1 ? '' : 's'} found</p>
      <div className="mt-2 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="table">
          <caption className="sr-only">Applications</caption>
          <thead><tr><th scope="col">Reference</th><th scope="col">Applicant</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Payment</th><th scope="col">Submitted</th></tr></thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/applications/${a.id}`} className="font-mono text-xs font-semibold">{a.referenceNumber}</Link></td>
                <td>{a.firstName} {a.lastName}<br /><span className="text-xs text-slate-600">{a.email}</span></td>
                <td>{a.category.name}</td>
                <td><StatusBadge status={a.status} /></td>
                <td>{a.payments.length ? <StatusBadge status="SUCCEEDED" /> : <span className="text-xs text-slate-600">Unpaid</span>}</td>
                <td className="whitespace-nowrap">{formatDateTime(a.submittedAt)}</td>
              </tr>
            ))}
            {apps.length === 0 && <tr><td colSpan={6} className="text-slate-600">No applications match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
          {page > 1 ? <Link className="btn-secondary btn-sm" href={qs(page - 1)}>Previous</Link> : <span />}
          <span className="text-sm">Page {page} of {pages}</span>
          {page < pages ? <Link className="btn-secondary btn-sm" href={qs(page + 1)}>Next</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
