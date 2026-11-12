import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ANNOUNCEMENT_LABELS, formatDate, mediaUrl } from '@/lib/content';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

const load = (slug) =>
  prisma.announcement.findFirst({ where: { slug, published: true, publishedAt: { lte: new Date() } }, include: { department: true } });

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.summary,
    openGraph: { type: 'article', title: a.title, description: a.summary, publishedTime: a.publishedAt?.toISOString(), images: a.imageKey ? [mediaUrl(a.imageKey)] : undefined },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) notFound();
  return (
    <>
      <PageHeader
        eyebrow={ANNOUNCEMENT_LABELS[a.category]}
        title={a.title}
        breadcrumbs={[{ href: '/', label: 'Home' }, { href: '/news', label: 'News' }, { label: a.title }]}
      />
      <article className="container-page max-w-3xl py-10">
        <p className="text-sm text-slate-600">
          Published <time dateTime={a.publishedAt?.toISOString()}>{formatDate(a.publishedAt)}</time>
          {a.department && <> · {a.department.name}</>}
        </p>
        {a.imageKey && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(a.imageKey)} alt={a.imageAlt || ''} className="mt-6 w-full rounded object-cover" />
        )}
        <p className="mt-6 text-lg font-medium text-slate-800">{a.summary}</p>
        {/* Rendered as plain text paragraphs — never as HTML — to prevent XSS. */}
        <div className="mt-6 space-y-4 leading-relaxed text-slate-800">
          {a.body.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
      </article>
    </>
  );
}
