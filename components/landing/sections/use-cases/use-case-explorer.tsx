'use client';
import { SectionSurface } from '@/components/ui/atoms';
import { SectionHeader } from '@/components/ui/patterns';
import { cn } from '@/styles';
import { containerMaxWidthVariants } from '@/styles/ui/shared/container-base';
import { LandingSection } from '../../layout/landing-section';
import { QuietUseCaseCard } from './quiet-use-case-card';
import { DEFAULT_USE_CASES } from './use-cases.data';
import cls from './use-cases.module.css';

export default function IndustryExplorer() {
  const entries = Object.entries(DEFAULT_USE_CASES) as Array<
    [keyof typeof DEFAULT_USE_CASES, (typeof DEFAULT_USE_CASES)[keyof typeof DEFAULT_USE_CASES]]
  >;

  return (
    <LandingSection tone="muted">
      <section 
        className={cn(
          containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true })
        )}
        aria-labelledby="use-cases-title"
      >
        {/* Tokenized background surface behind this section */}
        <SectionSurface variant="radial-grid" intensity={0.06} />
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

        <div className={cls['grid']}>
          {entries.map(([k, v]) => (
            <QuietUseCaseCard key={k} kind={k} data={v} />
          ))}
        </div>
      </section>
    </LandingSection>
  );
}
