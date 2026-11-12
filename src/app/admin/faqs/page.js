import { prisma } from '@/lib/prisma';
import { requirePageStaff } from '@/lib/auth/current-user';
import { PERMISSIONS } from '@/lib/rbac';
import { FAQ_LABELS } from '@/lib/content';
import { faqFields } from '@/lib/forms/admin-fields';
import ResourceForm from '@/components/admin/ResourceForm';

export const metadata = { title: 'FAQs' };

export default async function AdminFaqs() {
  await requirePageStaff(PERMISSIONS.CONTENT_MANAGE, '/admin/faqs');
  const [faqs, departments] = await Promise.all([
    prisma.faq.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
    prisma.department.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ]);
  const fields = faqFields(departments);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Frequently asked questions</h1>
      <p className="mt-1 text-slate-700">Do not publish fees, processing times or legal requirements until they are verified.</p>
      <details className="card mt-6">
        <summary className="cursor-pointer font-semibold text-primary-800">Add a question</summary>
        <div className="mt-4"><ResourceForm endpoint="/api/admin/faqs" fields={fields} idPrefix="faq-new" defaults={{ category: 'GENERAL', published: true, sortOrder: 0 }} submitLabel="Add question" successMessage="Question added." /></div>
      </details>
      <ul className="mt-6 space-y-3">
        {faqs.map((f) => (
          <li key={f.id}>
            <details className="card">
              <summary className="cursor-pointer">
                <span className="font-semibold text-primary-800">{f.question}</span>
                <span className="ml-2 text-xs text-slate-600">{FAQ_LABELS[f.category]}{!f.published && ' · unpublished'}</span>
              </summary>
              <div className="mt-4">
                <ResourceForm endpoint={`/api/admin/faqs/${f.id}`} method="PATCH" idPrefix={`faq-${f.id}`} fields={fields} defaults={f} deleteEndpoint={`/api/admin/faqs/${f.id}`} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
