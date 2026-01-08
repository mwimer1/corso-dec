---
status: "active"
last_updated: "2026-01-07"
category: "documentation"
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
| `/insights` | Blog/insights index with search, sort, and category filtering | `insights/page.tsx` | Node.js |
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

Route configuration is handled via inline exports in layout and page files:

```ts
// app/(marketing)/layout.tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// app/(marketing)/page.tsx (landing page - static generation)
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour
```

**Configuration details:**
- **Runtime**: Node.js (required for Clerk telemetry compatibility)
- **Dynamic**: Most routes use `force-dynamic`; landing page uses `force-static` for performance
- **Revalidate**: Landing page uses 1 hour ISR; other routes are always dynamic
- **SEO**: Marketing pages are indexed (configured via metadata exports)

## Page Implementations

### Landing Page (`/`)

```tsx
// FILE: app/(marketing)/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
import { FullWidthSection, PublicLayout } from '@/components';
import { Hero, IndustryExplorer, LazyMarketInsightsSection, ProductShowcase } from '@/components/landing';
import { landingNavItems } from '@/components/landing/layout/nav.config';

export const dynamic = "force-static";
export const revalidate = 3600; // 1 hour
export const runtime = "nodejs";

export default function MarketingHomePage() {
  return (
    <PublicLayout navMode="landing" navItems={landingNavItems}>
      <FullWidthSection
        padding="hero"
        containerMaxWidth="7xl"
        containerPadding="lg"
      >
        <Hero />
      </FullWidthSection>

      <FullWidthSection
        padding="section-sm"
        containerMaxWidth="7xl"
        containerPadding="lg"
        background="showcase"
        className="border-t border-border pt-0 sm:pt-0"
      >
        <ProductShowcase />
      </FullWidthSection>

      <FullWidthSection
        background="muted"
        padding="lg"
        containerMaxWidth="7xl"
        containerPadding="lg"
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
        className="border-t border-border"
      >
        <IndustryExplorer />
      </FullWidthSection>

      <FullWidthSection
        padding="lg"
        containerMaxWidth="7xl"
        containerPadding="lg"
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
      >
        <LazyMarketInsightsSection controlsVariant="dropdown" dense stickyMetrics />
      </FullWidthSection>
    </PublicLayout>
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
        headerSubtitle="Start with a 7-day free trial."
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
- **Use Case Explorer Section**: Includes the Industry Explorer section between hero and category filter (wrapped in `FullWidthSection` with `background="showcase"`)
- **URL Query Param Sync**: Category filter state syncs with URL (`?category=technology`) for shareable filtered views
- **Suspense Boundary**: Category filter wrapped in Suspense for proper Next.js App Router compatibility
- **Consistent Container Width**: Uses `max-w-7xl` with responsive padding (`px-4 sm:px-6 lg:px-8`) for alignment
- **ARIA Tablist Pattern**: Complete ARIA implementation for category filter tabs with proper tabpanel association
- **URL Parameters**: Supports `?category=slug`, `?q=search`, and `?sort=newest|oldest|title` for shareable filtered views
- **Search & Sort**: Client-side search (title + description) and sort (newest/oldest/title) with URL sync
- **Responsive Category Filter**: Mobile dropdown select, desktop horizontal scrollable chips
- **ISR Caching**: Uses `revalidate=300` (5 minutes) for performance while supporting URL query params
```tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see README)
// app/(marketing)/insights/page.tsx
// This is a server component page. Keep server exports and render client components inside.
import { FullWidthSection, PublicLayout } from "@/components";
import { CategoryFilterClient, InsightsHero } from "@/components/insights";
import { IndustryExplorer } from "@/components/landing";
import { CATEGORIES_UI } from "@/components/insights/constants";
import { getInsightsNavItems } from "@/components/insights/layout/nav.config";
import { getAllInsights, getCategories } from "@/lib/marketing/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const runtime = "nodejs";
// Use ISR for static content - revalidate every 5 minutes
// This allows URL query params (category, q, sort) while still benefiting from caching
export const revalidate = 300; // 5 minutes

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

export default async function InsightsPage() {
  const rawItems = await getAllInsights();
  const dynamicCategories = await getCategories();

  // Build counts map from actual content - count ALL categories per item, not just first
  const categoryCounts = new Map<string, number>();
  for (const item of rawItems) {
    // Iterate through all categories for each item
    for (const cat of item.categories || []) {
      const slug = cat.slug || 'general';
      const count = categoryCounts.get(slug) ?? 0;
      categoryCounts.set(slug, count + 1);
    }
  }

  // Start with curated categories (in UI order) with their counts
  const curatedWithCounts = CATEGORIES_UI.map(c => ({
    key: c.key,
    label: c.label,
    count: categoryCounts.get(c.key) ?? 0
  }));

  // Find categories from content/CMS that aren't in the curated list
  const newCategories = dynamicCategories
    .filter(cat => !CATEGORIES_UI.some(curated => curated.key === cat.slug))
    .map(cat => ({
      key: cat.slug,
      label: cat.name,
      count: categoryCounts.get(cat.slug) ?? 0
    }));

  // Combine: "All" first, then curated (in order), then new categories
  // Filter out categories with 0 counts
  const categoriesWithCounts = [
    { key: 'all', label: 'All', count: rawItems.length },
    ...curatedWithCounts.filter(c => c.count > 0),
    ...newCategories.filter(c => c.count > 0)
  ];

  return (
    <PublicLayout navMode="insights" navItems={getInsightsNavItems()}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <InsightsHero
          className="mt-8"
          title="Construction industry trends, market intel, and practical playbooks."
          description="Stay ahead with curated analysis of construction markets, technology, sustainability, and safety—written for busy teams."
        />
      </div>

      {/* Use Case Explorer Section */}
      <FullWidthSection
        background="showcase"
        padding="lg"
        containerMaxWidth="7xl"
        containerPadding="lg"
        className="border-t border-border"
      >
        <IndustryExplorer />
      </FullWidthSection>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="mt-6 h-12" />}>
          <CategoryFilterClient items={rawItems} categories={categoriesWithCounts} />
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
| `ProductShowcase` | `components/landing/sections/product-showcase/product-showcase.tsx` | Features showcase |
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

## Related Documentation

- [Marketing Components](../../components/marketing/README.md) - Marketing component documentation
- [Landing Components](../../components/landing/README.md) - Landing page components
- [App Directory](../../README.md) - Next.js App Router architecture
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Security patterns

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active
