import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { FAQ_LABELS } from '@/lib/content';
import { PageHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Frequently Asked Questions', description: 'Answers about passport and visa applications, documents, fees, payments, appointments and consular services.' };

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({ where: { published: true }, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }], include: { department: { select: { name: true, slug: true } } } });
  const groups = Object.keys(FAQ_LABELS).map((k) => [k, faqs.filter((f) => f.category === k)]).filter(([, list]) => list.length);
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently asked questions" breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'FAQ' }]} />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-4">
        <nav aria-label="FAQ topics">
          <ul className="space-y-2 text-sm lg:sticky lg:top-6">
            {groups.map(([k]) => <li key={k}><a href={`#${k.toLowerCase()}`}>{FAQ_LABELS[k]}</a></li>)}
          </ul>
        </nav>
        <div className="lg:col-span-3">
          {groups.length === 0 && <EmptyState title="No questions published yet" />}
          {groups.map(([k, list]) => (
            <section key={k} id={k.toLowerCase()} aria-labelledby={`${k}-h`} className="mb-10 scroll-mt-6">
              <h2 id={`${k}-h`} className="text-2xl font-semibold">{FAQ_LABELS[k]}</h2>
              <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {list.map((f) => (
                  <details key={f.id} className="group py-4">
                    <summary className="cursor-pointer list-none font-semibold text-primary-800 marker:hidden">
                      <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span>{f.question}
                    </summary>
                    <div className="mt-2 pl-5">
                      <p className="whitespace-pre-line text-slate-800">{f.answer}</p>
                      {f.department && <p className="mt-2 text-sm text-slate-600">Office: <Link href={`/offices/${f.department.slug}`}>{f.department.name}</Link></p>}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
