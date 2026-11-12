import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { formatMoney } from '@/lib/fees';
import { categoryFields, requirementFields, serviceFeeFields } from '@/lib/forms/admin-fields';
import ResourceForm from '@/components/admin/ResourceForm';
import { Alert } from '@/components/ui';

export const metadata = { title: 'Services & fees' };

export default async function AdminServices() {
  await requirePageStaff(PERMISSIONS.SERVICES_MANAGE, '/admin/services');
  const [categories, fees] = await Promise.all([
    prisma.applicationCategory.findMany({ orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }], include: { requirements: { orderBy: { sortOrder: 'asc' } } } }),
    prisma.serviceFee.findMany({ orderBy: { createdAt: 'asc' }, include: { category: { select: { name: true } } } }),
  ]);
  const feeFields = serviceFeeFields(categories);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Services, requirements &amp; fees</h1>
        <Alert type="warning" className="mt-4">
          Categories, eligibility, required documents and fees must be verified against official Embassy policy before the “placeholder” flag is removed. Fee changes apply to new checkouts immediately.
        </Alert>
      </div>

      <section aria-labelledby="cat-h">
        <h2 id="cat-h" className="text-2xl font-semibold">Application categories</h2>
        <div className="mt-4 space-y-3">
          {categories.map((c) => (
            <details key={c.id} className="card">
              <summary className="cursor-pointer">
                <span className="font-semibold text-primary-800">{c.name}</span>{' '}
                <span className="text-sm text-slate-600">· {c.type === 'PASSPORT' ? 'Passport' : 'Visa'} · {formatMoney(c.feeCents, c.currency)}{!c.active && ' · inactive'}{c.isPlaceholder && ' · placeholder'}</span>
              </summary>
              <div className="mt-4">
                <ResourceForm endpoint={`/api/admin/categories/${c.id}`} method="PATCH" idPrefix={`cat-${c.id}`} fields={categoryFields} defaults={c} />
                <h3 className="mt-8 font-sans text-lg font-bold">Required documents</h3>
                <ul className="mt-3 space-y-2">
                  {c.requirements.map((r) => (
                    <li key={r.id}>
                      <details className="rounded border border-slate-200 p-3">
                        <summary className="cursor-pointer text-sm"><strong>{r.label}</strong> {r.required ? '(required)' : '(optional)'} · {r.maxSizeMb} MB</summary>
                        <div className="mt-3"><ResourceForm endpoint={`/api/admin/requirements/${r.id}`} method="PATCH" idPrefix={`req-${r.id}`} fields={requirementFields} defaults={r} deleteEndpoint={`/api/admin/requirements/${r.id}`} deleteLabel="Remove requirement" /></div>
                      </details>
                    </li>
                  ))}
                </ul>
                <details className="mt-3 rounded border border-dashed border-slate-300 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-primary-700">Add a required document</summary>
                  <div className="mt-3"><ResourceForm endpoint={`/api/admin/categories/${c.id}/requirements`} idPrefix={`req-new-${c.id}`} fields={requirementFields} defaults={{ required: true, maxSizeMb: 5, acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], sortOrder: c.requirements.length }} submitLabel="Add document" successMessage="Requirement added." /></div>
                </details>
              </div>
            </details>
          ))}
        </div>
        <details className="card mt-4">
          <summary className="cursor-pointer font-semibold text-primary-700">Add a category</summary>
          <div className="mt-4"><ResourceForm endpoint="/api/admin/categories" idPrefix="cat-new" fields={categoryFields} defaults={{ type: 'VISA', active: false, isPlaceholder: true, feeCents: 0 }} submitLabel="Create category" successMessage="Category created." /></div>
        </details>
      </section>

      <section aria-labelledby="fees-h">
        <h2 id="fees-h" className="text-2xl font-semibold">Additional consular service fees</h2>
        <p className="mt-1 text-sm text-slate-700">Added to the application fee at checkout (for example a processing or return-postage fee).</p>
        <ul className="mt-4 space-y-3">
          {fees.map((f) => (
            <li key={f.id}>
              <details className="card">
                <summary className="cursor-pointer"><span className="font-semibold">{f.name}</span> <span className="text-sm text-slate-600">· {formatMoney(f.amountCents, f.currency)} · {f.category?.name || (f.appliesTo ? `all ${f.appliesTo.toLowerCase()} applications` : 'not assigned')}{!f.active && ' · inactive'}</span></summary>
                <div className="mt-4"><ResourceForm endpoint={`/api/admin/service-fees/${f.id}`} method="PATCH" idPrefix={`fee-${f.id}`} fields={feeFields} defaults={f} deleteEndpoint={`/api/admin/service-fees/${f.id}`} /></div>
              </details>
            </li>
          ))}
          {fees.length === 0 && <li className="text-sm text-slate-600">No additional fees configured.</li>}
        </ul>
        <details className="card mt-4">
          <summary className="cursor-pointer font-semibold text-primary-700">Add a service fee</summary>
          <div className="mt-4"><ResourceForm endpoint="/api/admin/service-fees" idPrefix="fee-new" fields={feeFields} defaults={{ active: true }} submitLabel="Add fee" successMessage="Fee added." /></div>
        </details>
      </section>
    </div>
  );
}
