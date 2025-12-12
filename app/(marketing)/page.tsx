// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
// FILE: app/(marketing)/page.tsx
// Server component page; marketing content is static and revalidated periodically.
import { FullWidthSection } from '@/components';
import { Hero, IndustryExplorer, LandingLayout, LazyMarketInsightsSection, ProductShowcase } from '@/components/landing';



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
        opacity="none"
        guidelineColor="bg-border"
      >
        <Hero />
      </FullWidthSection>

      <FullWidthSection
        padding="none"
        containerMaxWidth="7xl"
        containerPadding="lg"
        opacity="none"
        guidelineColor="bg-border"
      >
        <ProductShowcase />
      </FullWidthSection>

      <FullWidthSection
        containerMaxWidth="7xl"
        containerPadding="lg"
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
      >
        <IndustryExplorer />
      </FullWidthSection>

      {/* Testimonials intentionally omitted; see landing docs for status */}

      {/* Market Insights Section - Consolidated market intelligence dashboard */}
      <FullWidthSection
        containerMaxWidth="7xl"
        containerPadding="lg"
        guidesVisibility="always"
        opacity="none"
        guidelineColor="bg-border"
      >
        <LazyMarketInsightsSection controlsVariant="dropdown" dense stickyMetrics />
      </FullWidthSection>
    </LandingLayout>
  );
}
