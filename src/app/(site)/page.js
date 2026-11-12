import Link from 'next/link';
import { BookUser, Plane, Stamp, Phone, Search, Clock, ShieldAlert, ArrowRight, Megaphone, Building2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSetting, mediaUrl, formatDate, ANNOUNCEMENT_LABELS } from '@/lib/content';
import { PlaceholderNotice } from '@/components/ui';
import EmbassyIllustration from '@/components/site/EmbassyIllustration';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: { absolute: 'Embassy of the Republic of Higeria – Washington, D.C. (Demonstration Portal)' },
  description: 'Passport and visa applications, consular services, embassy offices, news and contact information.',
};

const QUICK_LINKS = [
  { href: '/services/passport', label: 'Passport applications', text: 'Apply for, renew or replace a Higerian passport.', icon: BookUser },
  { href: '/services/visa', label: 'Visa applications', text: 'Apply for a visa to travel to Higeria.', icon: Plane },
  { href: '/offices/consular-affairs', label: 'Consular services', text: 'Document services and assistance for citizens.', icon: Stamp },
  { href: '/contact', label: 'Contact the Embassy', text: 'Send an inquiry to an Embassy office.', icon: Phone },
];

export default async function HomePage() {
  const [home, site, important, latest, offices] = await Promise.all([
    getSetting('home'),
    getSetting('site'),
    prisma.announcement.findMany({ where: { published: true, important: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take: 2 }),
    prisma.announcement.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, take: 3 }),
    prisma.department.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, take: 6, select: { slug: true, name: true, shortDescription: true } }),
  ]);
  const hero = mediaUrl(home.heroImageKey);
  const ambassadorPhoto = mediaUrl(home.ambassadorImageKey);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-800 text-white">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={home.heroImageAlt || ''} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent-200">Republic of Higeria · Washington, D.C.</p>
            <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight text-white sm:text-5xl">{home.heroTitle}</h1>
            <p className="mt-4 max-w-2xl text-lg text-primary-100">{home.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services/passport" className="btn-accent">Apply for a passport</Link>
              <Link href="/services/visa" className="btn bg-white text-primary-800 hover:bg-primary-50">Apply for a visa</Link>
              <Link href="/track" className="btn border border-white/60 text-white hover:bg-white/10">
                <Search className="h-4 w-4" aria-hidden="true" /> Track an application
              </Link>
            </div>
          </div>
          <figure className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-lg border-4 border-ivory/80 shadow-2xl">
              <EmbassyIllustration className="block h-auto w-full" />
            </div>
            <figcaption className="mt-2 text-center text-xs text-primary-100">
              The Embassy of the Republic of Higeria, Washington, D.C. (artist’s impression)
            </figcaption>
          </figure>
        </div>
        <div className="flex h-2" aria-hidden="true">
          <div className="h-full w-full bg-ivory" /><div className="h-full w-[40%] shrink-0 bg-accent-500" />
        </div>
      </section>

      {/* Important notices */}
      {important.length > 0 && (
        <section aria-labelledby="notices-heading" className="border-b border-amber-200 bg-amber-50">
          <div className="container-page py-4">
            <h2 id="notices-heading" className="sr-only">Important notices</h2>
            <ul className="space-y-2">
              {important.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm text-amber-950">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span><strong>Important notice:</strong> <Link href={`/news/${a.slug}`} className="text-amber-950 underline">{a.title}</Link></span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Quick links */}
      <section aria-labelledby="services-heading" className="container-page py-12">
        <h2 id="services-heading" className="text-2xl font-semibold">Featured services</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ href, label, text, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="card group flex h-full flex-col no-underline transition-colors hover:border-primary-400">
                <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded bg-primary-50 text-primary-700"><Icon aria-hidden="true" /></span>
                <span className="font-serif text-lg font-semibold text-primary-800 group-hover:underline">{label}</span>
                <span className="mt-1 text-sm text-slate-700">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Welcome + ambassador */}
      <section className="bg-slate-50 py-12">
        <div className="container-page grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <PlaceholderNotice show={home.isPlaceholder} />
            <p className="eyebrow">Welcome</p>
            <h2 className="mt-1 text-2xl font-semibold">{home.welcomeTitle}</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-800">{home.welcomeMessage}</p>
          </div>
          <aside className="card lg:col-span-2" aria-labelledby="ambassador-heading">
            <p className="eyebrow">Message from the Ambassador</p>
            <div className="mt-3 flex items-center gap-4">
              {ambassadorPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ambassadorPhoto} alt={`Portrait of ${home.ambassadorName}`} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-700" aria-hidden="true">Photo</div>
              )}
              <div>
                <h2 id="ambassador-heading" className="text-lg font-semibold">{home.ambassadorName}</h2>
                <p className="text-sm text-slate-600">{home.ambassadorTitle}</p>
              </div>
            </div>
            <blockquote className="mt-4 whitespace-pre-line border-l-4 border-accent-500 pl-4 text-slate-800">{home.ambassadorMessage}</blockquote>
            <Link href="/about#ambassador" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Ambassador’s profile <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </aside>
        </div>
      </section>

      {/* News + hours */}
      <section className="container-page grid gap-8 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">Announcements and updates</h2>
            <Link href="/news" className="text-sm font-semibold">All news</Link>
          </div>
          <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {latest.map((a) => (
              <li key={a.id} className="py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">{ANNOUNCEMENT_LABELS[a.category]} · <time dateTime={a.publishedAt?.toISOString()}>{formatDate(a.publishedAt)}</time></p>
                <h3 className="mt-1 text-lg font-semibold"><Link href={`/news/${a.slug}`} className="text-primary-800">{a.title}</Link></h3>
                <p className="mt-1 text-sm text-slate-700">{a.summary}</p>
              </li>
            ))}
            {latest.length === 0 && <li className="py-5 text-sm text-slate-600">No announcements yet.</li>}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Clock className="h-5 w-5" aria-hidden="true" /> Office hours</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-800">{site.officeHours}</p>
            {site.consularHours && <p className="mt-2 whitespace-pre-line text-sm text-slate-800">{site.consularHours}</p>}
          </div>
          <div className="card border-accent-200 bg-accent-50">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-accent-800"><ShieldAlert className="h-5 w-5" aria-hidden="true" /> Emergency contact</h2>
            <p className="mt-2 text-sm text-slate-800">{site.emergencyNote}</p>
            <p className="mt-2 text-lg font-semibold text-accent-800">{site.emergencyPhone}</p>
          </div>
          {site.isPlaceholder && <p className="text-xs text-slate-600">Contact details shown are placeholders pending verification.</p>}
        </div>
      </section>

      {/* Offices */}
      <section className="border-t border-slate-200 bg-primary-50 py-12">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">Embassy offices</h2>
            <Link href="/offices" className="text-sm font-semibold">All offices</Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offices.map((o) => (
              <li key={o.slug}>
                <Link href={`/offices/${o.slug}`} className="card flex h-full gap-3 no-underline hover:border-primary-400">
                  <Building2 className="mt-1 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-primary-800">{o.name}</span>
                    <span className="mt-1 block text-sm text-slate-700">{o.shortDescription}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
