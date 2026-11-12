export default function Loading() {
  return (
    <div className="container-page flex flex-1 items-center justify-center py-20" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
