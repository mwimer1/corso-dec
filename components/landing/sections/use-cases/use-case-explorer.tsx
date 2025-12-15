import { SectionHeader } from '@/components/ui/patterns';
import type { UseCaseKey } from '@/lib/marketing/client';
import { DEFAULT_USE_CASES } from './use-cases.data';
import { IndustrySelectorPanel } from './industry-selector-panel';

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

  return (
    <section
      className="bg-surface border-t border-border"
      aria-labelledby="use-cases-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-lg">
        <div className="mx-auto max-w-4xl text-center mb-5xl">
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
      </div>
    </section>
  );
}
