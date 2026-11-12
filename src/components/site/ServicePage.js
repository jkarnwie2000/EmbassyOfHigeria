import Link from 'next/link';
import { CheckCircle2, FileText } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { computeFees, formatMoney } from '@/lib/fees';
import { getCurrentUser } from '@/lib/auth/current-user';
import { PageHeader, PlaceholderNotice, Alert } from '@/components/ui';
import StartApplicationButton from '@/components/applications/StartApplicationButton';
import { MIME_EXT } from '@/lib/uploads';

const STEPS = [
  'Create an account or sign in',
  'Choose the application type and complete the online form',
  'Upload the required documents and photograph',
  'Review your answers and submit to receive a reference number',
  'Pay the applicable fee securely through Stripe',
  'Track progress from your dashboard or the tracking page',
];

export default async function ServicePage({ type }) {
  const [categories, user] = await Promise.all([
    prisma.applicationCategory.findMany({
      where: { type, active: true },
      orderBy: { sortOrder: 'asc' },
      include: { requirements: { orderBy: { sortOrder: 'asc' } } },
    }),
    getCurrentUser(),
  ]);
  const withFees = await Promise.all(categories.map(async (c) => ({ ...c, fees: await computeFees(c.id) })));
  const label = type === 'PASSPORT' ? 'Passport' : 'Visa';
  const anyPlaceholder = categories.some((c) => c.isPlaceholder);

  return (
    <>
      <PageHeader
        eyebrow="Consular services"
        title={`${label} applications`}
        intro={
          type === 'PASSPORT'
            ? 'Eligible Higerian citizens in the United States can apply for, renew or replace a passport online.'
            : 'Travellers to Higeria can apply for a visa online. Choose the category that matches the purpose of your travel.'
        }
        breadcrumbs={[{ href: '/', label: 'Home' }, { label: `${label} applications` }]}
      />
      <div className="container-page py-10">
        <PlaceholderNotice show={anyPlaceholder}>
          Categories, eligibility rules, required documents and fees shown here are placeholders and have not been verified
          against official Embassy policy. Fees are Stripe test amounts only.
        </PlaceholderNotice>

        <section aria-labelledby="how-h" className="mb-10">
          <h2 id="how-h" className="text-2xl font-semibold">How to apply</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3 rounded border border-slate-200 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white" aria-hidden="true">{i + 1}</span>
                <span className="text-sm text-slate-800"><span className="sr-only">Step {i + 1}: </span>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {!user && (
          <Alert type="info" className="mb-8" title="You need an account to apply">
            <Link href={`/login?next=/services/${type.toLowerCase()}`}>Sign in</Link> or <Link href="/register">create an account</Link> to start an application. Your progress is saved as a draft.
          </Alert>
        )}

        <h2 className="text-2xl font-semibold">Choose an application type</h2>
        <ul className="mt-5 space-y-5">
          {withFees.map((c) => (
            <li key={c.id} className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <h3 className="text-xl font-semibold">{c.name}</h3>
                  <p className="mt-1 text-slate-800">{c.description}</p>
                  {c.eligibility && <p className="mt-2 text-sm text-slate-700"><strong>Eligibility:</strong> {c.eligibility}</p>}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-primary-700">Required documents ({c.requirements.length})</summary>
                    <ul className="mt-2 space-y-2">
                      {c.requirements.map((r) => (
                        <li key={r.id} className="flex gap-2 text-sm">
                          {r.required ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" /> : <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
                          <span>
                            <strong>{r.label}</strong> {r.required ? '' : '(optional)'} — {r.acceptedMime.map((m) => MIME_EXT[m].toUpperCase()).join(', ')}, max {r.maxSizeMb} MB
                            {r.description && <span className="block text-slate-600">{r.description}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
                <div className="shrink-0 md:w-56 md:text-right">
                  <p className="text-sm text-slate-600">Fee{c.fees.isPlaceholder ? ' (test amount)' : ''}</p>
                  <p className="text-2xl font-semibold text-primary-800">{formatMoney(c.fees.totalCents, c.fees.currency)}</p>
                  <div className="mt-3">
                    {user ? <StartApplicationButton categoryId={c.id} label={`Start ${c.name.toLowerCase()} application`} /> : <Link href={`/login?next=/services/${type.toLowerCase()}`} className="btn-primary w-full md:w-auto">Sign in to apply</Link>}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
