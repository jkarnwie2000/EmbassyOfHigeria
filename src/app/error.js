'use client';

import Link from 'next/link';

export default function GlobalError({ reset }) {
  return (
    <main id="main" className="container-page flex flex-1 flex-col items-start justify-center py-20">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-semibold">We could not load this page</h1>
      <p className="mt-3 text-slate-700">An unexpected error occurred. Your saved information has not been lost. Please try again.</p>
      <div className="mt-6 flex gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>Try again</button>
        <Link href="/" className="btn-secondary">Homepage</Link>
      </div>
    </main>
  );
}
