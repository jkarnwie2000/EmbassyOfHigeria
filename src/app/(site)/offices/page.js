import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Embassy Offices', description: 'Departments and offices of the Embassy of the Republic of Higeria in Washington, D.C.' };

export default async function OfficesPage() {
  const offices = await prisma.department.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  return (
    <>
      <PageHeader
        eyebrow="Offices"
        title="Embassy offices and departments"
        intro="Each office handles specific services. Choose an office to see its responsibilities, services, contact details and frequently asked questions."
        breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'Offices' }]}
      />
      <div className="container-page py-10">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offices.map((o) => (
            <li key={o.id}>
              <Link href={`/offices/${o.slug}`} className="card group flex h-full flex-col no-underline hover:border-primary-400">
                <Building2 className="h-6 w-6 text-primary-600" aria-hidden="true" />
                <h2 className="mt-3 text-xl font-semibold group-hover:underline">{o.name}</h2>
                <p className="mt-2 flex-1 text-sm text-slate-700">{o.shortDescription}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600">View office <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
