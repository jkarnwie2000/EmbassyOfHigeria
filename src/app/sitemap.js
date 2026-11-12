import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const staticPaths = ['', '/about', '/offices', '/services/passport', '/services/visa', '/news', '/faq', '/contact', '/track', '/privacy', '/accessibility', '/disclaimer'];
  const [offices, news] = await Promise.all([
    prisma.department.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.announcement.findMany({ where: { published: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 })),
    ...offices.map((o) => ({ url: `${base}/offices/${o.slug}`, lastModified: o.updatedAt, priority: 0.6 })),
    ...news.map((n) => ({ url: `${base}/news/${n.slug}`, lastModified: n.updatedAt, priority: 0.5 })),
  ];
}
