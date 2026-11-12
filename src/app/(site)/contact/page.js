import { MapPin, Phone, Mail, Clock, ShieldAlert } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/content';
import { PageHeader, PlaceholderNotice } from '@/components/ui';
import ContactForm from '@/components/forms/ContactForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact the Embassy', description: 'Contact details, office hours, location and inquiry form for the Embassy of the Republic of Higeria in Washington, D.C.' };

export default async function ContactPage({ searchParams }) {
  const sp = await searchParams;
  const [site, departments] = await Promise.all([
    getSetting('site'),
    prisma.department.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true } }),
  ]);
  const preselect = departments.find((d) => d.slug === sp.office)?.id;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&output=embed`;

  return (
    <>
      <PageHeader eyebrow="Contact" title="Contact the Embassy" breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'Contact' }]} />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-semibold">Send an inquiry</h2>
          <p className="mt-2 text-slate-700">Choose the office your inquiry is about so it reaches the right staff. Do not include passport numbers or other sensitive personal details.</p>
          <div className="mt-6"><ContactForm departments={departments} defaultDepartmentId={preselect} /></div>
        </div>
        <aside className="space-y-4 lg:col-span-2" aria-label="Embassy contact details">
          <PlaceholderNotice show={site.isPlaceholder}>Address, telephone numbers and email addresses below are placeholders pending verification.</PlaceholderNotice>
          <div className="card">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" /><span><strong className="block">Address</strong>{site.address}</span></li>
              <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" /><span><strong className="block">Telephone</strong>{site.phone}{site.fax && <><br />Fax: {site.fax}</>}</span></li>
              <li className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" /><span><strong className="block">Email</strong>{site.email}{site.consularEmail && <><br />Consular: {site.consularEmail}</>}</span></li>
              <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" /><span className="whitespace-pre-line"><strong className="block">Office hours</strong>{site.officeHours}</span></li>
              <li className="flex gap-3"><ShieldAlert className="h-5 w-5 shrink-0 text-accent-600" aria-hidden="true" /><span><strong className="block">Emergencies</strong>{site.emergencyPhone}</span></li>
            </ul>
          </div>
          <div className="overflow-hidden rounded border border-slate-200">
            <iframe title={`Map showing ${site.mapQuery}`} src={mapSrc} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </aside>
      </div>
    </>
  );
}
