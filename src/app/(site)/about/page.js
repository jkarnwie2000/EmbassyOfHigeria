import { getSetting } from '@/lib/content';
import { PageHeader, PlaceholderNotice } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'About the Embassy',
  description: 'History, mission and leadership of the Embassy of the Republic of Higeria in Washington, D.C., and Higeria–U.S. relations.',
};

function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 border-b border-slate-200 py-8 last:border-0">
      <h2 id={`${id}-h`} className="text-2xl font-semibold">{title}</h2>
      <div className="mt-3 leading-relaxed text-slate-800">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const [about, home] = await Promise.all([getSetting('about'), getSetting('home')]);
  const toc = [
    ['history', 'History'],
    ['mission', 'Mission and responsibilities'],
    ['ambassador', 'The Ambassador'],
    ['leadership', 'Embassy leadership'],
    ['mission-info', 'Diplomatic mission'],
    ['relations', 'Higeria–United States relations'],
  ];
  return (
    <>
      <PageHeader eyebrow="About" title="About the Embassy" breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'About' }]} />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-4">
        <nav aria-label="On this page" className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-600">On this page</p>
            <ul className="mt-3 space-y-2 text-sm">
              {toc.map(([id, label]) => (
                <li key={id}><a href={`#${id}`}>{label}</a></li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="lg:col-span-3">
          <PlaceholderNotice show={about.isPlaceholder} />
          <Section id="history" title="History"><p className="whitespace-pre-line">{about.history}</p></Section>
          <Section id="mission" title="Mission and responsibilities">
            <p className="whitespace-pre-line">{about.mission}</p>
            <ul className="mt-4 list-disc space-y-1 pl-6">{about.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
          </Section>
          <Section id="ambassador" title="The Ambassador">
            <p className="font-semibold">{home.ambassadorName}</p>
            <p className="text-sm text-slate-600">{home.ambassadorTitle}</p>
            <p className="mt-3 whitespace-pre-line">{about.ambassadorProfile}</p>
          </Section>
          <Section id="leadership" title="Embassy leadership">
            <ul className="grid gap-3 sm:grid-cols-2">
              {about.leadership.map((l, i) => (
                <li key={i} className="card py-4">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-sm text-slate-600">{l.title}</p>
                </li>
              ))}
            </ul>
          </Section>
          <Section id="mission-info" title="Diplomatic mission"><p className="whitespace-pre-line">{about.diplomaticMission}</p></Section>
          <Section id="relations" title="Higeria–United States relations"><p className="whitespace-pre-line">{about.bilateralRelations}</p></Section>
        </div>
      </div>
    </>
  );
}
