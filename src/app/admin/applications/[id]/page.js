import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { canAccessApplicationType, hasPermission, PERMISSIONS } from '@/lib/rbac';
import { STAFF_TRANSITIONS, TYPE_LABELS } from '@/lib/applications';
import { FIELDS } from '@/lib/forms/fields';
import { SECTION_TITLES } from '@/lib/validation/applications';
import { formatMoney } from '@/lib/fees';
import { formatDateTime } from '@/lib/content';
import { audit } from '@/lib/audit';
import { StatusBadge, STATUS_TEXT } from '@/components/ui';
import SubmittedDocuments from '@/components/applications/SubmittedDocuments';
import StatusForm from '@/components/admin/StatusForm';
import NoteForm from '@/components/admin/NoteForm';

export const metadata = { title: 'Review application' };

const show = (f, v) => {
  if (v === undefined || v === null || v === '') return '—';
  if (v === true) return 'Yes';
  return f.options?.find((o) => o.value === v)?.label ?? String(v);
};
const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

export default async function AdminApplicationPage({ params }) {
  const { id } = await params;
  const user = await requirePageStaff(PERMISSIONS.APPLICATIONS_VIEW, `/admin/applications/${id}`);
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      category: { include: { requirements: true } },
      applicant: { select: { email: true, firstName: true, lastName: true } },
      documents: { where: { status: { not: 'DELETED' } }, orderBy: { createdAt: 'asc' }, select: { id: true, docType: true, originalName: true, mimeType: true, sizeBytes: true, status: true, createdAt: true } },
      payments: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'asc' }, include: { changedBy: { select: { firstName: true, lastName: true } } } },
      notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!app || app.status === 'DRAFT' || !canAccessApplicationType(user, app.type)) notFound();
  await audit({ actor: user, action: 'application.viewed', entityType: 'Application', entityId: app.id });

  const canReview = hasPermission(user, PERMISSIONS.APPLICATIONS_REVIEW);
  const transitions = STAFF_TRANSITIONS[app.status] || [];
  const sections = Object.keys(FIELDS[app.type]).filter((s) => s !== 'declaration');

  return (
    <div className="space-y-6">
      <p><Link href="/admin/applications">← All applications</Link></p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{TYPE_LABELS[app.type]} · {app.category.name}</p>
          <h1 className="mt-1 text-3xl font-semibold">{app.firstName} {app.lastName}</h1>
          <p className="mt-1 font-mono text-sm">{app.referenceNumber}</p>
          <p className="text-sm text-slate-600">Account: {app.applicant.email} · Submitted {formatDateTime(app.submittedAt)}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {sections.map((s) => (
            <section key={s} className="card" aria-labelledby={`s-${s}`}>
              <h2 id={`s-${s}`} className="text-lg font-semibold">{SECTION_TITLES[s]}</h2>
              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {FIELDS[app.type][s].map((f) => (
                  <div key={f.name}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">{f.label}</dt>
                    <dd className="whitespace-pre-line break-words">{show(f, get(app.formData?.[s], f.name))}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <SubmittedDocuments documents={app.documents} requirements={app.category.requirements} title="Documents (opening a document is recorded in the audit log)" />
        </div>

        <div className="space-y-6">
          {canReview && (
            <section className="card" aria-labelledby="status-h">
              <h2 id="status-h" className="text-lg font-semibold">Update status</h2>
              {transitions.length ? <StatusForm applicationId={app.id} transitions={transitions.map((t) => ({ value: t, label: STATUS_TEXT[t] }))} /> : <p className="mt-2 text-sm text-slate-600">No further status changes are available.</p>}
            </section>
          )}
          <section className="card" aria-labelledby="pay-h">
            <h2 id="pay-h" className="text-lg font-semibold">Payments</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {app.payments.map((p) => (
                <li key={p.id}>{formatMoney(p.amountCents, p.currency)} <StatusBadge status={p.status} /> <span className="block text-xs text-slate-600">{formatDateTime(p.paidAt || p.createdAt)} {p.receiptNumber && `· ${p.receiptNumber}`}{p.failureReason && ` · ${p.failureReason}`}</span></li>
              ))}
              {app.payments.length === 0 && <li className="text-slate-600">No payments.</li>}
            </ul>
          </section>
          <section className="card" aria-labelledby="hist-h">
            <h2 id="hist-h" className="text-lg font-semibold">Status history</h2>
            <ol className="mt-2 space-y-2 text-sm">
              {app.statusHistory.map((h) => (
                <li key={h.id}><strong>{STATUS_TEXT[h.toStatus]}</strong> <span className="text-xs text-slate-600">{formatDateTime(h.createdAt)}{h.changedBy ? ` · ${h.changedBy.firstName} ${h.changedBy.lastName}` : ' · system'}</span>{h.publicNote && <span className="block text-slate-700">“{h.publicNote}”</span>}</li>
              ))}
            </ol>
          </section>
          <section className="card" aria-labelledby="notes-h">
            <h2 id="notes-h" className="text-lg font-semibold">Internal notes</h2>
            <p className="text-xs text-slate-600">Not visible to the applicant.</p>
            {canReview && <NoteForm applicationId={app.id} />}
            <ul className="mt-3 space-y-3 text-sm">
              {app.notes.map((n) => <li key={n.id} className="rounded bg-slate-50 p-2"><p className="whitespace-pre-line">{n.body}</p><p className="mt-1 text-xs text-slate-600">{n.author.firstName} {n.author.lastName} · {formatDateTime(n.createdAt)}</p></li>)}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
