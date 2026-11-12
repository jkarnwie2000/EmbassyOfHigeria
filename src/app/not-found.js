import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main id="main" className="container-page flex flex-1 flex-col items-start justify-center py-20">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-slate-700">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="btn-primary mt-6">Return to the homepage</Link>
    </main>
  );
}
