import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, Phone, Clock, MapPin, FileText } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/content';
import { PageHeader, PlaceholderNotice } from '@/components/ui';
import ContactForm from '@/components/forms/ContactForm';

export const dynamic = 'force-dynamic';

async function load(slug) {
  return prisma.department.findFirst({
    where: { slug, active: true },
    include: {
      faqs: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
      announcements: { where: { published: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take: 3 },
    },
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = await load(slug);
  return d ? { title: d.name, description: d.shortDescription, openGraph: { title: d.name, description: d.shortDescription } } : {};
}

export default async function OfficePage({ params }) {
  const { slug } = await params;
  const office = await load(slug);
  if (!office) notFound();
  const links = Array.isArray(office.relatedLinks) ? office.relatedLinks : [];

  return (
    <>
      <PageHeader
        eyebrow="Embassy office"
        title={office.name}
        intro={office.shortDescription}
        breadcrumbs={[{ href: '/', label: 'Home' }, { href: '/offices', label: 'Offices' }, { label: office.name }]}
      />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlaceholderNotice show={office.isPlaceholder} />
          <section aria-labelledby="about-h">
            <h2 id="about-h" className="text-2xl font-semibold">About this office</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-800">{office.description}</p>
          </section>
          {office.responsibilities.length > 0 && (
            <section aria-labelledby="resp-h" className="mt-8">
              <h2 id="resp-h" className="text-2xl font-semibold">Responsibilities</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-800">{office.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>
          )}
          {office.services.length > 0 && (
            <section aria-labelledby="svc-h" className="mt-8">
              <h2 id="svc-h" className="text-2xl font-semibold">Services provided</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-800">{office.services.map((s) => <li key={s}>{s}</li>)}</ul>
            </section>
          )}
          {links.length > 0 && (
            <section aria-labelledby="forms-h" className="mt-8">
              <h2 id="forms-h" className="text-2xl font-semibold">Application forms and links</h2>
              <ul className="mt-3 space-y-2">
                {links.map((l) => (
                  <li key={l.href} className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary-600" aria-hidden="true" /><Link href={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </section>
          )}
          {office.faqs.length > 0 && (
            <section aria-labelledby="faq-h" className="mt-8">
              <h2 id="faq-h" className="text-2xl font-semibold">Frequently asked questions</h2>
              <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {office.faqs.map((f) => (
                  <details key={f.id} className="group py-4">
                    <summary className="cursor-pointer list-none font-semibold text-primary-800 marker:hidden">
                      <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span>{f.question}
                    </summary>
                    <p className="mt-2 whitespace-pre-line pl-5 text-slate-800">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
          {office.announcements.length > 0 && (
            <section aria-labelledby="ann-h" className="mt-8">
              <h2 id="ann-h" className="text-2xl font-semibold">Office announcements</h2>
              <ul className="mt-3 space-y-3">
                {office.announcements.map((a) => (
                  <li key={a.id}><Link href={`/news/${a.slug}`} className="font-semibold">{a.title}</Link> <span className="text-sm text-slate-600">· {formatDate(a.publishedAt)}</span></li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="inq-h" className="mt-10 border-t border-slate-200 pt-8">
            <h2 id="inq-h" className="text-2xl font-semibold">Send an inquiry to this office</h2>
            <div className="mt-4"><ContactForm departments={[{ id: office.id, name: office.name }]} fixedDepartmentId={office.id} /></div>
          </section>
        </div>
        <aside className="space-y-4" aria-label="Office contact information">
          <div className="card">
            <h2 className="text-lg font-semibold">Contact information</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{office.email || 'Email: to be confirmed'}</li>
              <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{office.phone || 'Telephone: to be confirmed'}</li>
              {office.location && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{office.location}</li>}
              <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="whitespace-pre-line">{office.officeHours || 'Hours to be confirmed'}</span></li>
            </ul>
          </div>
          {office.handlesType && (
            <div className="card bg-primary-50">
              <h2 className="text-lg font-semibold">Apply online</h2>
              <p className="mt-2 text-sm text-slate-700">Start a {office.handlesType === 'PASSPORT' ? 'passport' : 'visa'} application online.</p>
              <Link href={office.handlesType === 'PASSPORT' ? '/services/passport' : '/services/visa'} className="btn-primary mt-3 w-full">Start application</Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
