// app/not-found.tsx
import Link from 'next/link';

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-lg">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-muted">We couldn't find that page.</p>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-border px-4 py-2
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                     focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:bg-muted"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
