import { SectionHeader } from '@/components/ui/patterns';
import type { UseCaseKey } from '@/lib/marketing/client';
import { IndustrySelectorPanel } from './industry-selector-panel';
import { DEFAULT_USE_CASES } from './use-cases.data';

interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
}

export default function IndustryExplorer() {
  // Transform DEFAULT_USE_CASES into Industry array
  const industries: Industry[] = Object.entries(DEFAULT_USE_CASES).map(([key, data]) => ({
    key: key as UseCaseKey,
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    benefits: data.benefits,
    impact: data.impact,
  }));

  // Removed inner section wrapper - parent FullWidthSection provides full-bleed background and border
  // Reduced header margin from mb-5xl to mb-4xl for tighter spacing (~80px instead of ~96px)
  return (
    <>
      <div className="mx-auto max-w-4xl text-center mb-4xl">
        <SectionHeader
          id="use-cases-title"
          headingLevel={2}
          align="center"
          title="Built for your industry."
          subtitle="Discover how Corso turns building-permit data into actionable business intelligence."
          size="marketingHero"
        />
      </div>

      <IndustrySelectorPanel industries={industries} />
    </>
  );
}
