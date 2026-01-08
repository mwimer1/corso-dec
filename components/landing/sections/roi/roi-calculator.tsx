"use client";

// ROI calculator used in Market Insights
import { Button } from "@/components/ui/atoms";
import { NumberInputWithSteppers } from "../../widgets/number-input-with-steppers";
// landing shared types intentionally not imported here to avoid intra-domain root rules
import { LinkTrack } from "@/components/ui/molecules";
import { calcRoi, clamp } from "@/lib/marketing/client";
import { APP_LINKS } from '@/lib/shared';
import { trackNavClick } from "@/lib/shared/analytics/track";
import React, { useId, useMemo, useState } from "react";
import { RoiOutputPanel } from "./roi-output-panel";
import { RoiLabelTooltip } from "./roi-label-tooltip";
import styles from "./roi.module.css";

// Import LandingSection for consistent layout
import { LandingSection } from "../../layout/landing-section";

// Math & formatting moved to shared util (see imports above)

export const ROICalculator: React.FC = () => {
  const [leads, setLeads] = useState<number>(100);
  const [closeRate, setCloseRate] = useState<number>(20);
  const [dealSize, setDealSize] = useState<number>(20000);

  const { newDeals, workdaysSaved, totalRevenue } = useMemo(
    () => calcRoi({ leads, closeRate, dealSize }),
    [leads, closeRate, dealSize]
  );

  const ids = {
    leads: useId(),
    closeRate: useId(),
    dealSize: useId(),
  };

  // Increment helpers handled inside NumberInputWithSteppers

  return (
    <LandingSection tone="brand" className="text-center border-t-0">
      <div className={styles['roiHeader']}>
        <h2 className={styles['roiTitle']}>Turn Leads Into Revenue—Instantly</h2>
        <p className={styles['roiSubtitle']}>
          Model your ROI in seconds. See revenue lift, new deals, and days saved using your numbers.
        </p>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid gap-y-8 gap-x-8 lg:grid-cols-[minmax(240px,380px)_minmax(300px,480px)] xl:grid-cols-[minmax(280px,480px)_minmax(320px,560px)] justify-center items-stretch"
        >
          {/* Left: Input Card */}
          <div className="max-w-[560px] lg:max-w-[480px] xl:max-w-[560px] w-full mx-auto">
            <div className={styles['roiInputCard']} suppressHydrationWarning>
              <h2 className="sr-only">ROI Calculator</h2>

              {/* Leads */}
              <div className={styles['roiInputGroup']}>
                <RoiLabelTooltip
                  assumptions={[
                    "We assume ~2 hours saved per lead.",
                    "8 hours = 1 workday.",
                  ]}
                  id={`${ids.leads}-tooltip`}
                  position="top"
                >
                  <span className={styles['roiLabel']}>
                    Leads Identified
                  </span>
                </RoiLabelTooltip>
                <label htmlFor={ids.leads} className="sr-only">
                  Leads Identified
                </label>
                
                <NumberInputWithSteppers
                  id={ids.leads}
                  value={leads}
                  min={1}
                  max={100000}
                  onChange={(v) => setLeads(clamp(v, 1, 100000))}
                  step={10}
                  increaseAria="Increase leads identified by 10"
                  decreaseAria="Decrease leads identified by 10"
                  className={styles['numberField'] || ''}
                  ariaDescribedBy={`${ids.leads}-hint ${ids.leads}-microcopy`}
                  formatWithCommas
                />
                <p id={`${ids.leads}-hint`} className="sr-only">Annual number of new leads identified.</p>
              </div>

              {/* Close Rate */}
              <div className={styles['roiInputGroup']}>
                <RoiLabelTooltip
                  assumptions="New Deals = Leads × (Close Rate/100)."
                  id={`${ids.closeRate}-tooltip`}
                  position="top"
                >
                  <span className={styles['roiLabel']}>
                    Close Rate (%)
                  </span>
                </RoiLabelTooltip>
                <label htmlFor={ids.closeRate} className="sr-only">
                  Close Rate (%)
                </label>
                <NumberInputWithSteppers
                  id={ids.closeRate}
                  value={closeRate}
                  min={1}
                  max={100}
                  onChange={(v) => setCloseRate(clamp(v, 1, 100))}
                  step={5}
                  increaseAria="Increase close rate by 5"
                  decreaseAria="Decrease close rate by 5"
                  className={styles['numberField'] || ''}
                  ariaDescribedBy={`${ids.closeRate}-hint`}
                />
                <p id={`${ids.closeRate}-hint`} className="sr-only">Percentage of identified leads that close.</p>
              </div>

              {/* Deal Size */}
              <div className={styles['roiInputGroup']}>
                <RoiLabelTooltip
                  assumptions="Revenue = New Deals × Avg. Deal Size."
                  id={`${ids.dealSize}-tooltip`}
                  position="top"
                >
                  <span className={styles['roiLabel']}>
                    Avg. Deal Size
                  </span>
                </RoiLabelTooltip>
                <label htmlFor={ids.dealSize} className="sr-only">
                  Avg. Deal Size
                </label>
                <div className={styles['prefixContainer']}>
                  <span className={styles['prefixSymbol']}>$</span>
                  <NumberInputWithSteppers
                    id={ids.dealSize}
                    value={dealSize}
                    min={100}
                    max={1_000_000}
                    onChange={(v) => setDealSize(clamp(v, 100, 1_000_000))}
                    step={10000}
                    increaseAria="Increase average deal size by $10,000"
                    decreaseAria="Decrease average deal size by $10,000"
                    className={styles['numberField'] || ''}
                    ariaDescribedBy={`${ids.dealSize}-hint`}
                    formatWithCommas
                  />
                </div>
                <p id={`${ids.dealSize}-hint`} className="sr-only">Average value of each closed deal in dollars.</p>
              </div>

              <div className={styles['roiCta']}>
                <Button asChild variant="outline" size="lg" className="w-full py-4 text-base font-semibold text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
                  {APP_LINKS.NAV.BOOK_DEMO.startsWith("/") ? (
                    <LinkTrack href={APP_LINKS.NAV.BOOK_DEMO} label="roi:book-demo">Book a demo</LinkTrack>
                  ) : (
                    <a
                      href={APP_LINKS.NAV.BOOK_DEMO}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="roi-cta-book-demo"
                      onClick={() => {
                        try {
                          trackNavClick("roi:book-demo", APP_LINKS.NAV.BOOK_DEMO);
                        } catch {
                          // edge-safe silent fail by convention
                        }
                      }}
                    >
                      Book a demo
                    </a>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="max-w-[560px] lg:max-w-[480px] xl:max-w-[560px] w-full mx-auto flex flex-col h-full">
            <RoiOutputPanel
              revenueGrowth={totalRevenue}
              newDeals={newDeals}
              workdaysSaved={workdaysSaved}
            />
          </div>
        </div>
      </div>
    </LandingSection>
  );
};

// OutputCard removed; replaced by ROIOutputCard


