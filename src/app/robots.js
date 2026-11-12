export default function robots() {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  // Demonstration deployments must not be indexed. Set ALLOW_INDEXING=true only after official approval.
  const allow = process.env.ALLOW_INDEXING === 'true';
  return {
    rules: allow
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/api'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
