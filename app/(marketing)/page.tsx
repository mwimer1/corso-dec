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
      {/* Hero section: responsive fluid spacing with consistent section system */}
      <FullWidthSection
        padding="hero"
        containerMaxWidth="7xl"
        containerPadding="lg"
      >
        <Hero />
      </FullWidthSection>

      {/* ProductShowcase: consistent section spacing */}
      <FullWidthSection
        padding="section-sm"
        containerMaxWidth="7xl"
        containerPadding="lg"
        className="border-t border-border"
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
