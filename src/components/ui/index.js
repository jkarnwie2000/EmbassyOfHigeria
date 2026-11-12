import Link from 'next/link';
import { Info, AlertCircle, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

export function PageHeader({ eyebrow, title, intro, breadcrumbs }) {
  return (
    <div className="border-b border-slate-200 bg-primary-50">
      <div className="container-page py-8 sm:py-10">
        {breadcrumbs && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
              {breadcrumbs.map((b, i) => (
                <li key={b.href || b.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                  {b.href ? <Link href={b.href}>{b.label}</Link> : <span aria-current="page">{b.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-3xl text-lg text-slate-700">{intro}</p>}
      </div>
    </div>
  );
}

const ALERT_STYLES = {
  info: ['border-primary-300 bg-primary-50 text-primary-900', Info],
  error: ['border-accent-300 bg-accent-50 text-accent-900', AlertCircle],
  success: ['border-emerald-300 bg-emerald-50 text-emerald-900', CheckCircle2],
  warning: ['border-amber-300 bg-amber-50 text-amber-950', AlertTriangle],
};

export function Alert({ type = 'info', title, children, className = '' }) {
  const [style, Icon] = ALERT_STYLES[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded border p-4 ${style} ${className}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      </div>
    </div>
  );
}

export function PlaceholderNotice({ show = true, children }) {
  if (!show) return null;
  return (
    <Alert type="warning" title="Placeholder content" className="mb-6">
      {children || 'This information has not yet been verified by the Embassy and must not be relied upon.'}
    </Alert>
  );
}

const STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-800',
  SUBMITTED: 'bg-primary-100 text-primary-900',
  PAYMENT_PENDING: 'bg-amber-100 text-amber-950',
  PAYMENT_CONFIRMED: 'bg-sky-100 text-sky-950',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-950',
  ADDITIONAL_DOCUMENTS_REQUIRED: 'bg-orange-100 text-orange-950',
  APPROVED: 'bg-emerald-100 text-emerald-950',
  REJECTED: 'bg-accent-100 text-accent-900',
  COMPLETED: 'bg-emerald-200 text-emerald-950',
  PENDING: 'bg-amber-100 text-amber-950',
  SUCCEEDED: 'bg-emerald-100 text-emerald-950',
  FAILED: 'bg-accent-100 text-accent-900',
  CANCELED: 'bg-slate-100 text-slate-800',
  EXPIRED: 'bg-slate-100 text-slate-800',
  REFUNDED: 'bg-slate-100 text-slate-800',
  NEW: 'bg-amber-100 text-amber-950',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-950',
  RESOLVED: 'bg-emerald-100 text-emerald-950',
  CLOSED: 'bg-slate-100 text-slate-800',
};

export const STATUS_TEXT = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PAYMENT_PENDING: 'Payment pending',
  PAYMENT_CONFIRMED: 'Payment confirmed',
  UNDER_REVIEW: 'Under review',
  ADDITIONAL_DOCUMENTS_REQUIRED: 'Additional documents required',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  SUCCEEDED: 'Paid',
  FAILED: 'Failed',
  CANCELED: 'Cancelled',
  EXPIRED: 'Expired',
  REFUNDED: 'Refunded',
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-100'}`}>
      {STATUS_TEXT[status] || status}
    </span>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded border border-dashed border-slate-300 p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-600">{children}</div>}
    </div>
  );
}
