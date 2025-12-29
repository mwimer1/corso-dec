// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
// FILE: app/(marketing)/page.tsx
// Server component page; marketing content is static and revalidated periodically.
import { FullWidthSection, PublicLayout } from '@/components';
import { Hero, IndustryExplorer, LazyMarketInsightsSection, ProductShowcase } from '@/components/landing';
import { landingNavItems } from '@/components/landing/layout/nav.config';



export const dynamic = "force-static";
export const revalidate = 3600; // 1 hour
export const runtime = "nodejs";

export default function MarketingHomePage() {
  return (
    <PublicLayout navMode="landing" navItems={landingNavItems}>
      {/* Hero section: Attio-style fold composition - reduced padding for tighter spacing */}
      <FullWidthSection
        padding="sm"
        containerMaxWidth="7xl"
        containerPadding="lg"
        showVerticalGuidelines={true}
        opacity="none"
        guidelineColor="bg-border"
        className="!pb-0"
      >
        <Hero />
      </FullWidthSection>

      {/* ProductShowcase: Negative margin pulls preview up for fold composition */}
      <FullWidthSection
        padding="sm"
        containerMaxWidth="7xl"
        containerPadding="lg"
        showVerticalGuidelines={true}
        opacity="none"
        guidelineColor="bg-border"
        className="-mt-8 md:-mt-12"
      >
        <ProductShowcase />
      </FullWidthSection>

      {/* Industry Use Case section: full-bleed grey background with border-top separator */}
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

      {/* Testimonials intentionally omitted; see landing docs for status */}

      {/* Market Insights Section - Consolidated market intelligence dashboard */}
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
