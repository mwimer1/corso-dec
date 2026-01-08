// Node.js required: Clerk keyless telemetry compatibility (justify if applicable, e.g., server-only deps or telemetry). Keep Edge if not required.
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';
import RouteThemeMarketing from './_theme';

/** @knipignore */
export const metadata: Metadata = {
  title: "Corso | Construction Intelligence Platform",
  description:
    "Turn building-permit data into actionable market intelligence with Corso.",
  openGraph: {
    title: "Corso | Construction Intelligence Platform",
    description:
      "Turn building-permit data into actionable market intelligence with Corso.",
    type: "website",
  },
  alternates: {
    canonical: 'https://getcorso.com/',
  },
};

// Add missing Node runtime flags for consistency with repo rules
/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <>
      <RouteThemeMarketing />
      {children}
    </>
  );
}
