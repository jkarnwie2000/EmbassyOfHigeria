import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ANNOUNCEMENT_LABELS, formatDate, mediaUrl } from '@/lib/content';
import { PageHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'News and Announcements', description: 'Embassy news, consular announcements, visa and passport updates, government notices and community events.' };

export default async function NewsPage({ searchParams }) {
  const sp = await searchParams;
  const category = Object.keys(ANNOUNCEMENT_LABELS).includes(sp.category) ? sp.category : undefined;
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);
  const where = { published: true, publishedAt: { lte: new Date() }, ...(category ? { category } : {}) };
  const [items, total] = await Promise.all([
    prisma.announcement.findMany({ where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * 10, take: 10 }),
    prisma.announcement.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 10));
  const href = (p, c = category) => `/news?${new URLSearchParams({ ...(c ? { category: c } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <>
      <PageHeader eyebrow="News" title="News and announcements" breadcrumbs={[{ href: '/', label: 'Home' }, { label: 'News' }]} />
      <div className="container-page py-10">
        <nav aria-label="Filter by category" className="mb-8">
          <ul className="flex flex-wrap gap-2">
            <li><Link href="/news" aria-current={!category ? 'page' : undefined} className={`btn-sm btn ${!category ? 'bg-primary-700 text-white' : 'btn-secondary'}`}>All</Link></li>
            {Object.entries(ANNOUNCEMENT_LABELS).map(([key, label]) => (
              <li key={key}>
                <Link href={href(1, key)} aria-current={category === key ? 'page' : undefined} className={`btn btn-sm ${category === key ? 'bg-primary-700 text-white' : 'btn-secondary'}`}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        {items.length === 0 ? (
          <EmptyState title="No announcements found" />
        ) : (
          <ul className="space-y-6">
            {items.map((a) => (
              <li key={a.id} className="card flex flex-col gap-4 sm:flex-row">
                {a.imageKey && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(a.imageKey)} alt={a.imageAlt || ''} className="h-40 w-full rounded object-cover sm:w-56" />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">
                    {ANNOUNCEMENT_LABELS[a.category]} · <time dateTime={a.publishedAt?.toISOString()}>{formatDate(a.publishedAt)}</time>
                  </p>
                  <h2 className="mt-1 text-xl font-semibold"><Link href={`/news/${a.slug}`} className="text-primary-800">{a.title}</Link></h2>
                  <p className="mt-2 text-slate-700">{a.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
            {page > 1 ? <Link href={href(page - 1)} className="btn-secondary">Previous</Link> : <span />}
            <span className="text-sm text-slate-600">Page {page} of {pages}</span>
            {page < pages ? <Link href={href(page + 1)} className="btn-secondary">Next</Link> : <span />}
          </nav>
        )}
      </div>
    </>
  );
}
