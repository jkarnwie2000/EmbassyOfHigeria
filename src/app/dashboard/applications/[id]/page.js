import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePageUser } from '@/lib/auth/current-user';
import { feesForDisplay, formatMoney } from '@/lib/fees';
import { formatDateTime } from '@/lib/content';
import { TYPE_LABELS } from '@/lib/applications';
import { StatusBadge, Alert, PlaceholderNotice, STATUS_TEXT } from '@/components/ui';
import ApplicationWizard from '@/components/applications/ApplicationWizard';
import PayButton from '@/components/applications/PayButton';
import DeleteDraftButton from '@/components/applications/DeleteDraftButton';
import AdditionalDocsPanel from '@/components/applications/AdditionalDocsPanel';
import SubmittedDocuments from '@/components/applications/SubmittedDocuments';

export const metadata = { title: 'Application' };

const docSelect = { id: true, docType: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true };

export default async function ApplicationPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePageUser(`/dashboard/applications/${id}`);
  const app = await prisma.application.findFirst({
    where: { id, applicantId: user.id }, // ownership enforced in the query itself
    include: {
      category: { include: { requirements: { orderBy: { sortOrder: 'asc' } } } },
      documents: { where: { status: 'ACTIVE' }, select: docSelect, orderBy: { createdAt: 'asc' } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
      documentRequests: { where: { resolvedAt: null }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!app) notFound();
  const fees = await feesForDisplay(app.categoryId);
  const requirements = app.category.requirements.map(({ docType, label, description, acceptedMime, maxSizeMb, required }) => ({ docType, label, description, acceptedMime, maxSizeMb, required }));

  if (app.status === 'DRAFT') {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{TYPE_LABELS[app.type]} application · Draft</p>
            <h1 className="mt-1 text-3xl font-semibold">{app.category.name}</h1>
          </div>
          <DeleteDraftButton applicationId={app.id} />
        </div>
        <PlaceholderNotice show={app.category.isPlaceholder}>Requirements and fees for this category are placeholders pending verification. Do not enter real personal information.</PlaceholderNotice>
        <div className="card">
          <ApplicationWizard
            application={{ id: app.id, type: app.type, formData: app.formData }}
            requirements={requirements}
            initialDocuments={app.documents}
            fees={fees}
          />
        </div>
      </div>
    );
  }

  const paid = app.payments.find((p) => p.status === 'SUCCEEDED');
  const publicNotes = app.statusHistory.filter((h) => h.toStatus !== 'DRAFT');

  return (
    <div className="space-y-6">
      {sp.submitted && (
        <Alert type="success" title="Application submitted">
          Your reference number is <strong className="font-mono">{app.referenceNumber}</strong>. A confirmation has been sent to your email address.
          {app.status === 'PAYMENT_PENDING' && ' Please complete payment below so that your application can be reviewed.'}
        </Alert>
      )}
      {sp.payment === 'cancelled' && <Alert type="warning" title="Payment cancelled">No payment was taken. You can try again when you are ready.</Alert>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{TYPE_LABELS[app.type]} application</p>
          <h1 className="mt-1 text-3xl font-semibold">{app.category.name}</h1>
          <p className="mt-2 text-slate-700">Reference: <strong className="font-mono">{app.referenceNumber}</strong></p>
        </div>
        <div className="text-right"><StatusBadge status={app.status} /><p className="mt-1 text-xs text-slate-600">Submitted {formatDateTime(app.submittedAt)}</p></div>
      </div>

      {app.status === 'PAYMENT_PENDING' && (
        <section className="card border-amber-300" aria-labelledby="pay-h">
          <h2 id="pay-h" className="text-xl font-semibold">Payment summary</h2>
          <table className="table mt-3">
            <caption className="sr-only">Fees payable</caption>
            <tbody>
              {fees.lineItems.map((li, i) => <tr key={i}><td>{li.name}</td><td className="text-right">{li.formatted}</td></tr>)}
              <tr><th scope="row">Total</th><th className="text-right">{fees.totalFormatted}</th></tr>
            </tbody>
          </table>
          {fees.isPlaceholder && <p className="mt-2 text-xs text-slate-600">Stripe test mode: use card 4242 4242 4242 4242, any future expiry and any CVC. No real money is charged.</p>}
          <div className="mt-4"><PayButton applicationId={app.id} total={fees.totalFormatted} /></div>
          <p className="mt-3 text-xs text-slate-600">You will be taken to Stripe’s secure checkout page. The Embassy portal never sees your card details.</p>
        </section>
      )}

      {app.status === 'ADDITIONAL_DOCUMENTS_REQUIRED' && (
        <AdditionalDocsPanel
          applicationId={app.id}
          requests={app.documentRequests.map((r) => ({ id: r.id, message: r.message, createdAt: r.createdAt.toISOString() }))}
          requirements={requirements}
          documents={app.documents}
        />
      )}

      <section className="card" aria-labelledby="timeline-h">
        <h2 id="timeline-h" className="text-xl font-semibold">Progress</h2>
        <ol className="mt-4 space-y-4 border-l-2 border-primary-200 pl-5">
          {publicNotes.map((h) => (
            <li key={h.id}>
              <p className="font-semibold">{STATUS_TEXT[h.toStatus]}</p>
              <p className="text-xs text-slate-600">{formatDateTime(h.createdAt)}</p>
              {h.publicNote && <p className="mt-1 text-sm text-slate-800">{h.publicNote}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card" aria-labelledby="pay-hist-h">
        <h2 id="pay-hist-h" className="text-xl font-semibold">Payments</h2>
        {app.payments.length === 0 ? <p className="mt-2 text-sm text-slate-600">No payments yet.</p> : (
          <ul className="mt-3 divide-y divide-slate-100">
            {app.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>{formatDateTime(p.createdAt)} · {formatMoney(p.amountCents, p.currency)} <StatusBadge status={p.status} /></span>
                {p.status === 'SUCCEEDED' && <a href={`/api/payments/${p.id}/receipt`} className="inline-flex items-center gap-1 font-semibold"><Download className="h-4 w-4" aria-hidden="true" /> Receipt {p.receiptNumber}</a>}
              </li>
            ))}
          </ul>
        )}
        {paid && <p className="mt-2 text-sm text-emerald-800">Paid on {formatDateTime(paid.paidAt)}.</p>}
      </section>

      <SubmittedDocuments documents={app.documents} requirements={requirements} />

      <p><Link href="/dashboard">← Back to my applications</Link></p>
    </div>
  );
}
