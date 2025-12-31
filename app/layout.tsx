// app/layout.tsx
// Description: Root layout for the app, provides global providers, theme, and skip-nav for accessibility.
import { ClerkEventsHandler } from '@/components/auth';
// Defer importing shared barrels at module scope to avoid import-time side-effects
// when Next collects route config. Use process.env for build-time checks here.
import { getEnv } from '@/lib/server/env';
import { latoVariable } from "@/styles/fonts";
import "@/styles/globals.css";
// AG Grid base CSS (required for structural styles)
import 'ag-grid-community/styles/ag-grid.css';
// AG Grid Quartz theme base CSS (required for themeQuartz Theming API)
import 'ag-grid-community/styles/ag-theme-quartz.css';
// AG Grid custom theme overrides (Theming API compatible)
import '@/styles/ui/ag-grid.theme.css';
import type { Viewport } from "next";
import Script from 'next/script';
import type { ReactNode } from "react";
import Providers from './providers';

// App Router segment config — must be top-level literals
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  // Avoid importing BrandAssets at module scope; use static paths to prevent
  // evaluating barrels that may pull client-only modules during config collection.
  const { NEXT_PUBLIC_SITE_URL } = getEnv();
  return {
    title: "Corso | Construction Intelligence Platform",
    description:
      "Turn building-permit data into actionable market intelligence with Corso.",
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
    },
    openGraph: {
      title: "Corso | Construction Intelligence Platform",
      description:
        "Turn building-permit data into actionable market intelligence with Corso.",
      type: "website",
    },
    metadataBase: new URL(NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // Avoid module-scope env reads; resolve at runtime on server
  const { NEXT_PUBLIC_STAGE: stage, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL } = getEnv();
  const isDev = getEnv().NODE_ENV === 'development';
  const publicEnvPayload = {
    NEXT_PUBLIC_STAGE: stage,
    NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL,
    // extend as needed
  };

  return (
    <html lang="en" className={latoVariable} data-route-theme="protected" suppressHydrationWarning>
      <head>
        <Script
          id="public-env"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(){if("undefined"!=typeof window&&"undefined"==typeof window.__PUBLIC_ENV__){window.__PUBLIC_ENV__=${JSON.stringify(publicEnvPayload)};}}();`,
          }}
        />
      </head>
      <body className="overflow-x-hidden">
        <Providers>
          {stage === 'development' || isDev ? <ClerkEventsHandler /> : null}
          {children}
        </Providers>
      </body>
    </html>
  );
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The themeColor is set via CSS variables (see globals.css) for dynamic theming
};
