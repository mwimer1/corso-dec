"use client";

// ROI calculator used in Market Insights
import { Button } from "@/components/ui/atoms";
import { NumberInputWithSteppers } from "../../widgets/number-input-with-steppers";
// landing shared types intentionally not imported here to avoid intra-domain root rules
import { LinkTrack } from "@/components/ui/molecules";
import { calcRoi, clamp } from "@/lib/marketing/client";
import { APP_LINKS } from '@/lib/shared';
import { trackNavClick } from "@/lib/shared/analytics/track";
import * as Tooltip from "@radix-ui/react-tooltip";
import React, { useId, useMemo, useState } from "react";
import { RoiOutputPanel } from "./roi-output-panel";
import cls from "./roi.module.css";

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
      <div className={cls['roiHeader']}>
        <h2 className={cls['roiTitle']}>Turn Leads Into Revenue—Instantly</h2>
        <p className={cls['roiSubtitle']}>
          Model your ROI in seconds. See revenue lift, new deals, and days saved using your numbers.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
        <div
          className="grid gap-y-8 gap-x-8 md:grid-cols-1 xl:grid-cols-[minmax(320px,560px)_minmax(320px,560px)] justify-center items-start"
        >
          {/* Left: Input Card */}
          <div className="max-w-[560px] w-full">
            <div className={cls['roiInputCard']} suppressHydrationWarning>
              <h2 className="sr-only">ROI Calculator</h2>

              {/* Leads */}
              <div className={cls['roiInputGroup']}>
                <label htmlFor={ids.leads} className={cls['roiLabel']}>
                  Leads Identified
                </label>
                
                <NumberInputWithSteppers
                  id={ids.leads}
                  value={leads}
                  min={1}
                  max={100000}
                  onChange={(v) => setLeads(clamp(v, 1, 100000))}
                  step={10}
                  increaseAria="Increase leads by 10"
                  decreaseAria="Decrease leads by 10"
                  className={cls['numberField'] || ''}
                  ariaDescribedBy={`${ids.leads}-hint ${ids.leads}-microcopy`}
                />
                <p id={`${ids.leads}-hint`} className="sr-only">Annual number of new leads identified.</p>
              </div>

              {/* Close Rate */}
              <div className={cls['roiInputGroup']}>
                <label htmlFor={ids.closeRate} className={cls['roiLabel']}>Close Rate (%)</label>
                <NumberInputWithSteppers
                  id={ids.closeRate}
                  value={closeRate}
                  min={1}
                  max={100}
                  onChange={(v) => setCloseRate(clamp(v, 1, 100))}
                  step={5}
                  increaseAria="Increase close rate by 5"
                  decreaseAria="Decrease close rate by 5"
                  className={cls['numberField'] || ''}
                  ariaDescribedBy={`${ids.closeRate}-hint`}
                />
                <p id={`${ids.closeRate}-hint`} className="sr-only">Percentage of identified leads that close.</p>
              </div>

              {/* Deal Size */}
              <div className={cls['roiInputGroup']}>
                <label htmlFor={ids.dealSize} className={cls['roiLabel']}>Avg. Deal Size</label>
                <div className={cls['prefixContainer']}>
                  <span className={cls['prefixSymbol']}>$</span>
                  <NumberInputWithSteppers
                    id={ids.dealSize}
                    value={dealSize}
                    min={100}
                    max={1_000_000}
                    onChange={(v) => setDealSize(clamp(v, 100, 1_000_000))}
                    step={10000}
                    increaseAria="Increase average deal size by $10,000"
                    decreaseAria="Decrease average deal size by $10,000"
                    className={cls['numberField'] || ''}
                    ariaDescribedBy={`${ids.dealSize}-hint`}
                  />
                </div>
                <p id={`${ids.dealSize}-hint`} className="sr-only">Average value of each closed deal in dollars.</p>
              </div>

              <div className={cls['roiCta']}>
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

          {/* Right: Results (stretch to match left card height and align content to bottom) */}
          <div className="max-w-[560px] w-full self-stretch h-full flex flex-col justify-end">
            <RoiOutputPanel
              revenueGrowth={totalRevenue}
              newDeals={newDeals}
              workdaysSaved={workdaysSaved}
            />
            <div className="mt-4 text-sm text-left">
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    >
                      Assumptions
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      sideOffset={8}
                      className="max-w-xs p-3 rounded-md shadow-lg bg-popover text-popover-foreground text-sm leading-normal z-50 border border-border"
                    >
                      We assume ~2 hours saved per lead. 8 hours = 1 workday. New Deals = Leads × (Close Rate/100). Revenue = New Deals × Avg. Deal Size.
                      <Tooltip.Arrow className="fill-popover" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
};

// OutputCard removed; replaced by ROIOutputCard


