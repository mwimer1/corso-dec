---
title: "(marketing)"
description: "Documentation and resources for documentation functionality. Located in (marketing)/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
## 🚀 Quick Reference

| Path | Purpose | Component | Runtime |
|------|---------|-----------|---------|
| `/` | Landing page with hero, showcase, use cases, market insights | `page.tsx` | Node.js |
| `/legal` | Legal pages index (navigation hub) | `legal/page.tsx` | Node.js |
| `/terms` | Terms of Service | `terms/page.tsx` | Node.js |
| `/privacy` | Privacy Policy | `privacy/page.tsx` | Node.js |
| `/cookies` | Cookie Notice | `cookies/page.tsx` | Node.js |
| `/contact` | Contact form and information | `contact/page.tsx` | Node.js |
| `/insights` | Blog/insights index with categories | `insights/page.tsx` | Node.js |
| `/insights/[slug]` | Article detail pages | `insights/[slug]/page.tsx` | Node.js |
| `/insights/categories/[category]` | Category-specific insights | `insights/categories/[category]/page.tsx` | Node.js |
| `/pricing` | Pricing plans with billing toggle | `pricing/page.tsx` | Node.js |

**Runtime: All marketing routes use Node.js runtime due to Clerk telemetry compatibility**

## 📁 Directory Structure

```
app/(marketing)/
├── _theme.tsx                   # Marketing theme provider - sets data-route-theme="marketing"
├── layout.tsx                   # Shared layout with SEO metadata and theme provider
├── page.tsx                     # Landing page (static generation, 1hr revalidate)
├── loading.tsx                  # Marketing-specific loading state
├── error.tsx                    # Marketing error boundary
├── route.config.ts              # Public access, force-cache, SEO indexing enabled
├── legal/                       # Legal pages index (navigation hub)
│   └── page.tsx                 # Legal index page (noindex)
├── terms/                       # Terms of Service
│   └── page.tsx                 # Terms content page
├── privacy/                     # Privacy Policy
│   └── page.tsx                 # Privacy content page
├── cookies/                     # Cookie Notice
│   └── page.tsx                 # Cookie content page
├── contact/                     # Contact form and information
│   └── page.tsx                 # Contact form and info page
├── insights/                    # Blog/insights section
│   ├── page.tsx                 # Insights index with hero, categories, and filtering
│   ├── [slug]/                  # Article detail pages
│   │   ├── not-found.tsx        # 404 handler for invalid article slugs
│   │   └── page.tsx             # Article content with dynamic SEO metadata
│   └── categories/              # Category-specific insights pages
│       └── [category]/          # Dynamic category filtering
│           └── page.tsx         # Category page with filtered insights
└── pricing/                     # Pricing and billing pages
    ├── page.tsx                 # Pricing plans with interactive billing toggle
    └── scroll-to-faq.tsx        # Client-side FAQ scroll helper
```

## ✅ Key Routes

| Path | Status | Key Features |
|------|--------|--------------|
| `/` | ✅ Active | Static generation, hero/product showcase, use cases, market insights |
| `/legal` | ✅ Active | Legal pages index - navigation hub (noindex) |
| `/terms` | ✅ Active | Terms of Service content |
| `/privacy` | ✅ Active | Privacy Policy content |
| `/cookies` | ✅ Active | Cookie Notice content |
| `/contact` | ✅ Active | Contact form and information |
| `/insights` | ✅ Active | Blog index with hero, categories, and filtering |
| `/insights/[slug]` | ✅ Active | Article detail with dynamic SEO metadata |
| `/insights/categories/[category]` | ✅ Active | Category-specific insights filtering |
| `/pricing` | ✅ Active | Pricing plans, billing toggle, FAQ section |

## 🎨 Layout & Configuration

### Shared Layout (`layout.tsx`)
- **Runtime**: Node.js (Clerk compatibility)
- **Theme**: Sets `data-route-theme="marketing"` via `_theme.tsx`
- **SEO**: Base metadata with canonical `https://getcorso.com/`

### Route Configuration
```ts
export const route = {
  access: 'public',
  cache: 'force-cache',
  revalidate: 60,
  seo: { index: true },
  owners: ['marketing'],
} as const;
```

## Page Implementations

### Landing Page (`/`)

```tsx
// FILE: app/(marketing)/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
import { Hero, LandingLayout, LazyMarketInsightsSection, ProductShowcase, UseCaseExplorer } from '@/components/landing';
import { FullWidthSection } from '@/components/ui';

export const dynamic = "force-static";
export const revalidate = 3600; // 1 hour
export const runtime = "nodejs";

export default function MarketingHomePage() {
  return (
    <LandingLayout>
      <FullWidthSection
        padding="sm"
        containerMaxWidth="7xl"
        containerPadding="lg"
        showVerticalGuidelines
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
      >
        <Hero />
      </FullWidthSection>

      <FullWidthSection
        containerMaxWidth="7xl"
        containerPadding="lg"
        showVerticalGuidelines
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
      >
        <ProductShowcase />
      </FullWidthSection>

      <FullWidthSection
        containerMaxWidth="7xl"
        containerPadding="lg"
        showVerticalGuidelines
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
      >
        <UseCaseExplorer />
      </FullWidthSection>

      {/* Market Insights Section - Consolidated market intelligence dashboard */}
      <FullWidthSection
        containerMaxWidth="7xl"
        containerPadding="lg"
        showVerticalGuidelines
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
      >
        <LazyMarketInsightsSection controlsVariant="dropdown" dense stickyMetrics />
      </FullWidthSection>
    </LandingLayout>
  );
}
```

### Pricing Page (`/pricing`)

```tsx
// FILE: app/(marketing)/pricing/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
// Client component to handle plan selection redirects
"use client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { PricingPage } from "@/components/marketing";
import { PublicLayout } from "@/components/ui/organisms";
import { PRICING_UI, formatPriceUSD } from "@/components";
import { useRouter } from "next/navigation";
import ScrollToFAQ from "./scroll-to-faq";
import { landingNavItems } from "@/components/landing/layout/nav.config";

// Transform PRICING_UI data into PricingPlan format (monthly pricing only)
const pricingPlans = Object.entries(PRICING_UI).map(([key, plan]) => ({
  slug: key,
  title: plan.label,
  priceText: formatPriceUSD(plan.monthlyUsd) + '/mo',
  priceNote: 'billed monthly',
  description: plan.tagline,
  features: plan.features,
  ctaText: "Start free",
  popular: plan.popular,
}));

// FAQ data
const faqItems = [
  {
    question: "What's included in the free trial?",
    answer: "Full access to all features for 7 days. No credit card required.",
  },
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee on all plans.",
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees. You only pay for the plan you choose.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. No long-term contracts.",
  },
] as const;

export default function PublicPricingPage() {
  const router = useRouter();

  const handlePlanSelect = (planSlug: string) => {
    // Persist selected plan (already handled by PricingPage component)
    // Redirect to sign-in route with plan parameter for post-auth redirect to pricing
    router.push(`/sign-in?plan=${planSlug}&redirect=/pricing`);
  };

  return (
    <PublicLayout navMode="landing" navItems={landingNavItems}>
      <ScrollToFAQ />
      <PricingPage
        plans={pricingPlans}
        faqs={faqItems}
        headerTitle="Choose Your Plan"
        headerSubtitle="Start with a 7-day free trial — no credit card required."
        onPlanSelect={handlePlanSelect}
      />
    </PublicLayout>
  );
}
```

### Legal Pages

All legal pages are now simple, direct routes:

- **`/legal`** - Legal pages index (navigation hub, noindex)
- **`/terms`** - Terms of Service content
- **`/privacy`** - Privacy Policy content
- **`/cookies`** - Cookie Notice content
- **`/contact`** - Contact form and information

This simplified structure removes the unnecessary entity abstraction for MVP simplicity.

```tsx
// FILE: app/(marketing)/terms/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
import { LegalPageSection, TermsContent } from "@/components/marketing";
import type { Metadata } from "next";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Terms of Service | Corso",
  description: "Legal terms and conditions for using the Corso platform.",
  openGraph: {
    title: "Terms of Service | Corso",
    description: "Legal terms and conditions for using the Corso platform.",
    type: "website",
  },
  alternates: { canonical: "/terms" },
} satisfies Metadata;

export default function TermsPage() {
  return (
    <LegalPageSection title="Terms of Service" subtitle="Corso" headingLevel={1}>
      <TermsContent />
    </LegalPageSection>
  );
}
```

```tsx
// FILE: app/(marketing)/contact/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
import {
    ContactInfo,
    ContactFormWrapper,
    LegalPageSection,
} from "@/components/marketing";
import { submitContactForm } from "./contact/actions";
import type { ContactFormSubmitData } from "@/types/forms";
import type { Metadata } from "next";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Contact | Corso",
  description: "Get in touch with the Corso team.",
  openGraph: {
    title: "Contact | Corso",
    description: "Get in touch with the Corso team.",
    type: "website",
  },
  alternates: { canonical: "/contact" },
} satisfies Metadata;

export default function ContactPage() {
  // Server action for contact form submissions
  const handleFormSubmit = async (data: ContactFormSubmitData): Promise<void> => {
    "use server";
    await submitContactForm(data);
  };

  return (
    <LegalPageSection title="Contact" subtitle="Corso" headingLevel={1}>
      <div className="mt-lg not-prose">
        <div className="grid grid-cols-1 gap-3xl lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-xl shadow-card">
            <ContactFormWrapper
              title="Send us a message"
              description="Fill out the form below and we'll get back to you within one business day."
              onSubmit={handleFormSubmit}
              successMessage="Thank you for your message! We'll get back to you within one business day."
              errorMessage="There was an error sending your message. Please try again or contact us directly."
            />
          </div>
          <ContactInfo />
        </div>
      </div>
    </LegalPageSection>
  );
}
```

### Insights Pages (`/insights/*`)

#### Index Page (`insights/page.tsx`)

**Key Features:**
- **URL Query Param Sync**: Category filter state syncs with URL (`?category=technology`) for shareable filtered views
- **Suspense Boundary**: Category filter wrapped in Suspense for proper Next.js App Router compatibility
- **Consistent Container Width**: Uses `max-w-7xl` with responsive padding (`px-4 sm:px-6 lg:px-8`) for alignment
- **ARIA Tablist Pattern**: Complete ARIA implementation for category filter tabs with proper tabpanel association
```tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
// app/(marketing)/insights/page.tsx
// This is a server component page. Keep server exports and render client components inside.
import { PublicLayout } from "@/components";
import { CategoryFilterClient, InsightsHero } from "@/components/insights";
import { getInsightsNavItems } from "@/components/insights/layout/nav.config";
import { getAllInsights } from "@/lib/marketing/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Dynamic to support URL query params for category filtering
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Insights | Corso",
  description:
    "Construction industry trends, market intelligence, and practical playbooks from Corso.",
  openGraph: {
    title: "Insights | Corso",
    description:
      "Construction industry trends, market intelligence, and practical playbooks from Corso.",
    type: "website",
  },
  alternates: {
    canonical: 'https://getcorso.com/insights',
  },
};

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'technology', label: 'Technology' },
  { key: 'market-analysis', label: 'Market Analysis' },
  { key: 'sustainability', label: 'Sustainability' },
  { key: 'cost-management', label: 'Cost Management' },
  { key: 'safety', label: 'Safety' },
];

export default async function InsightsPage() {
  const rawItems = await getAllInsights();
  const items = rawItems.map((insight: any) => ({
    slug: insight.slug,
    title: insight.title,
    excerpt: insight.description || '',
    date: insight.publishDate ? new Date(insight.publishDate).toLocaleDateString() : '',
    category: insight.categories?.[0]?.name || 'General',
    imageUrl: insight.imageUrl,
    readingTime: insight.readingTime ? `${insight.readingTime} min read` : undefined,
  }));

  // counts for chips
  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    const count = categoryCounts.get(item.category) ?? 0;
    categoryCounts.set(item.category, count + 1);
  }

  const counts = Object.fromEntries([
    ['all', items.length] as const,
    ...Array.from(categoryCounts.entries()).map(([cat, count]) => [cat, count] as const)
  ]);

  const categoriesWithCounts = CATEGORIES.map(c => ({
    key: c.key,
    label: c.label,
    count: counts[c.key] ?? 0
  }));

  return (
    <PublicLayout navMode="insights" navItems={getInsightsNavItems()} showVerticalGuidelines>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InsightsHero
          title="Construction industry trends, market intel, and practical playbooks."
          description="Stay ahead with curated analysis of construction markets, technology, sustainability, and safety—written for busy teams."
        />
        <Suspense fallback={<div className="mt-6 h-12" />}>
          <CategoryFilterClient items={items} categories={categoriesWithCounts} />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
```

#### Category Pages (`/insights/categories/[category]`)

Category-specific insights pages that filter and display insights by category.

```tsx
// FILE: app/(marketing)/insights/categories/[category]/page.tsx
import { InsightsLayout, InsightsList } from '@/components/insights';
import { getAllInsights } from '@/lib/marketing/server';
import { trackEvent } from '@/lib/shared/analytics/track';
import type { Metadata } from 'next';

export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const cat = params.category;
  return { title: `${cat} | Corso Insights`, description: `Insights in category ${cat}` };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const { category } = params;
  const all = await getAllInsights();
  const filtered = all.filter((i) => (i.categories ?? []).some((c) => c.slug === category));

  const handleResultClick = (slug: string, position: number) => {
    trackEvent('category_result_click', { slug, position, category });
  };

  return (
    <InsightsLayout>
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Category: {category}</h1>
          <InsightsList insights={filtered} onResultClick={handleResultClick} />
        </div>
      </div>
    </InsightsLayout>
  );
}
```

#### Article Pages (`/insights/[slug]`)

**File**: `app/(marketing)/insights/[slug]/page.tsx`
**Route**: `/insights/[slug]`
**Runtime**: Node.js

Dynamic article pages with SEO metadata generation, reading progress indicator, and breadcrumb navigation:

**Key Features:**
- **Reading Progress Bar**: Visual progress indicator at the top of the page (enabled via `showReadingProgress={true}` on `PublicLayout`)
- **Breadcrumb Navigation**: Visible breadcrumb trail (Home > Insights > Article Title) for improved UX
- **H1 Semantic Structure**: Article title renders as H1 for proper SEO and accessibility
- **Structured Data**: JSON-LD breadcrumbs and article metadata for search engines (includes `updatedDate` support)
- **Optimized Layout**: Content width set to `max-w-3xl` (768px) for optimal readability
- **Unified Metadata Bar**: Date, reading time, and author displayed in a responsive horizontal layout with icons
- **Enhanced Typography**: Comprehensive prose styling for headings, paragraphs, lists, blockquotes, code blocks, and images
- **Image Optimization**: Hero images with blur placeholders, lazy loading, and hover effects via `ArticleImage` component
- **Component Architecture**: Consolidated `InsightHeaderBlock` component with `ArticleMetadata` and `ArticleImage` sub-components
- **Accessibility**: Full ARIA labels, semantic HTML (`<section>`, `<aside>`, `<figure>`), and microdata support
- **Responsive Design**: Mobile-first spacing and layout adjustments throughout

```typescript
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
// app/(marketing)/insights/[slug]/page.tsx
// Server component page; contains metadata export
/* ------------------------------------------------------------------
   Insight Article Page (dynamic RSC)
   • Generates SEO metadata from fetched article
   • Uses safe, local interface to avoid mismatch with auto-generated types
------------------------------------------------------------------- */
import { PublicLayout } from "@/components";
import { InsightDetail } from "@/components/insights";
import { getInsightsNavItems } from "@/components/insights/layout/nav.config";
import { getInsightBySlug, getRelatedInsights } from "@/lib/marketing/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

/**
 * Only the fields we need for SEO.
 * Keeps compile-time strictness even if CMS types drift.
 */
interface InsightSEO {
  title: string;
  description?: string | null;
}

// Client component; dynamic not required

/** Build <title> + <meta> from fetched article. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getInsightBySlug(slug) as (InsightSEO & { title: string; description?: string | null; imageUrl?: string | null; publishDate?: string | null }) | undefined;

  if (item) {
    const description = item.description ?? "Read this insight on Corso.";
    return {
      title: `${item.title} | Corso Insights`,
      description,
      alternates: {
        canonical: `https://getcorso.com/insights/${slug}`,
      },
      openGraph: {
        title: item.title,
        description,
        url: `https://getcorso.com/insights/${slug}`,
        type: "article",
        ...(item.imageUrl ? { images: [{ url: item.imageUrl }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: item.title,
        description,
        ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
      },
    };
  }

  return {
    title: "Insights Article | Corso",
    description: "Read the latest insights on Corso.",
  };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getInsightBySlug(slug);

  if (!item) notFound();

  // Get related articles using the content service's unified logic
  const relatedInsights = await getRelatedInsights(item, { limit: 3 });
  const relatedArticles = relatedInsights.map(insight => ({
    slug: insight.slug,
    title: insight.title,
    ...(insight.description && { excerpt: insight.description }),
    ...(insight.imageUrl && { imageUrl: insight.imageUrl }),
    ...(insight.categories && { categories: insight.categories.map(cat => ({ name: cat.name })) }),
    ...(insight.publishDate && { publishDate: insight.publishDate }),
    ...(insight.author && { author: { name: insight.author.name, slug: insight.author.name.toLowerCase().replace(/\s+/g, '-') } }),
    ...(insight.readingTime !== undefined && { readingTime: insight.readingTime }),
  }));

  return (
    <PublicLayout
      navMode="insights"
      navItems={getInsightsNavItems()}
      showReadingProgress={true}
      showVerticalGuidelines
    >
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <InsightDetail
          initialData={item}
          relatedArticles={relatedArticles}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Insights', href: '/insights' },
            { label: item.title, href: `/insights/${slug}` },
          ]}
        />
      </div>
    </PublicLayout>
  );
}
```

## 🛠️ Utility Components

### Theme Provider (`_theme.tsx`)

**File**: `app/(marketing)/_theme.tsx`
**Purpose**: Sets marketing theme on document element

```tsx
'use client';
import { useEffect } from 'react';

export default function RouteThemeMarketing() {
  useEffect(() => {
    const prev = document.documentElement.dataset["routeTheme"] || 'protected';
    document.documentElement.dataset["routeTheme"] = 'marketing';
    return () => {
      document.documentElement.dataset["routeTheme"] = prev || 'protected';
    };
  }, []);
  return null;
}
```

### Scroll-to-FAQ Helper (`pricing/scroll-to-faq.tsx`)

**File**: `app/(marketing)/pricing/scroll-to-faq.tsx`
**Purpose**: Client-side FAQ scrolling helper

```tsx
"use client";

// Client-only helper that scrolls to the #faq anchor when the page loads
// and the current URL includes the "#faq" hash. Extracted to a dedicated
// client component to avoid invoking React hooks in a Server Component context
// during prerender/build.
import * as React from "react";

export default function ScrollToFAQ(): null {
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#faq") {
      const timer = setTimeout(() => {
        const faqElement = document.getElementById("faq");
        if (faqElement) {
          faqElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, []);

  return null;
}
```

### Error Boundary (`error.tsx`)

**File**: `app/(marketing)/error.tsx`
**Purpose**: Marketing-specific error boundary

```tsx
'use client';

import { ErrorFallback } from "@/components/ui";

export default function MarketingError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
```

### Loading State (`loading.tsx`)

**File**: `app/(marketing)/loading.tsx`
**Purpose**: Marketing-specific loading state

```tsx
import { RouteLoading } from "@/components/ui";

export default function MarketingLoading() {
  return <RouteLoading message="Loading page..." />;
}
```

### 404 Handler (`insights/[slug]/not-found.tsx`)

**File**: `app/(marketing)/insights/[slug]/not-found.tsx`
**Purpose**: Article not found page

```tsx
export const runtime = "nodejs";

export default function NotFound() {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold">Article not found</h1>
      <p className="opacity-80">The insight you're looking for doesn't exist.</p>
    </section>
  );
}
```

## 🔍 SEO & Performance

- **Static Generation**: Landing page (`force-static`, 1hr revalidate), insights index
- **Dynamic Metadata**: Article pages with OpenGraph/social sharing
- **Canonical URLs**: All pages include canonical links
- **Node.js Runtime**: Required for Clerk telemetry compatibility

## 🔒 Security

- **Contact Form**: CSRF protection, rate limiting (5/10min), Turnstile bot verification
- **Input Validation**: Zod schemas server-side
- **Error Handling**: No sensitive data leakage

## 📦 Key Components & Data

| Component | Location | Purpose |
|-----------|----------|---------|
| `Hero` | `components/landing/sections/hero/hero.tsx` | Main hero section |
| `ProductShowcase` | `components/landing/sections/product-showcase.tsx` | Features showcase |
| `PricingPage` | `components/marketing/sections/pricing/pricing-page.tsx` | Pricing with plans/FAQ |
| `ContactFormWrapper` | `components/marketing/contact/contact-form-wrapper.tsx` | Secure contact form |
| `InsightsList` | `components/insights/sections/insights-list.tsx` | Blog articles list (3×2 grid) |
| `PRICING_UI` | `components/marketing/sections/pricing/plan-ui.ts` | Plan configuration |
| `staticInsights` | `lib/marketing/insights/static-data.ts` | Blog data (6 mock articles) |
| `submitContactForm` | `app/(marketing)/contact/actions.ts` | Contact server action (feature-colocated) |

## 🧪 Development

```bash
pnpm dev                    # Start dev server
pnpm typecheck             # TypeScript validation
pnpm lint                   # Lint code
pnpm vitest run            # Test components
```

**Test URLs:**
- Landing: `http://localhost:3000/`
- Pricing: `http://localhost:3000/pricing`
- Legal Index: `http://localhost:3000/legal`
- Terms: `http://localhost:3000/terms`
- Privacy: `http://localhost:3000/privacy`
- Cookies: `http://localhost:3000/cookies`
- Contact: `http://localhost:3000/contact`
- Insights: `http://localhost:3000/insights`
- Article: `http://localhost:3000/insights/[slug]`

---

**Last updated:** 2025-09-10
