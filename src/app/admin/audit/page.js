import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { formatDateTime } from '@/lib/content';

export const metadata = { title: 'Audit log' };
const PAGE = 50;

export default async function AuditLogPage({ searchParams }) {
  const sp = await searchParams;
  await requirePageStaff(PERMISSIONS.AUDIT_VIEW, '/admin/audit');
  const action = typeof sp.action === 'string' ? sp.action.slice(0, 80) : '';
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);
  const where = action ? { action: { contains: action } } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE, take: PAGE, include: { actor: { select: { email: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p) => `?${new URLSearchParams({ ...(action && { action }), page: String(p) })}`;
  return (
    <div>
      <h1 className="text-3xl font-semibold">Audit log</h1>
      <p className="mt-1 text-sm text-slate-700">Append-only record of sign-ins, document access, status changes and configuration changes.</p>
      <form className="mt-4 flex flex-wrap items-end gap-3" role="search">
        <div><label htmlFor="action" className="label">Action contains</label><input id="action" name="action" defaultValue={action} className="input" placeholder="e.g. document, auth, payment" /></div>
        <button className="btn-primary" type="submit">Filter</button>
      </form>
      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th scope="col">Time</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Entity</th><th scope="col">IP</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</td>
                <td className="text-xs">{l.actor?.email || 'system'}</td>
                <td className="font-mono text-xs">{l.action}</td>
                <td className="text-xs">{l.entityType}{l.entityId && <span className="block font-mono text-slate-500">{l.entityId.slice(0, 28)}</span>}</td>
                <td className="text-xs">{l.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
          {page > 1 ? <Link className="btn-secondary btn-sm" href={qs(page - 1)}>Newer</Link> : <span />}
          <span className="text-sm">Page {page} of {pages}</span>
          {page < pages ? <Link className="btn-secondary btn-sm" href={qs(page + 1)}>Older</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
