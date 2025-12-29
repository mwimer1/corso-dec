"use client";

// ROI calculator used in Market Insights
import { Button } from "@/components/ui/atoms";
import { NumberInputWithSteppers } from "../../widgets/number-input-with-steppers";
// landing shared types intentionally not imported here to avoid intra-domain root rules
import { LinkTrack } from "@/components/ui/molecules";
import { calcRoi, clamp } from "@/lib/marketing/client";
import { APP_LINKS } from '@/lib/shared';
import { trackNavClick } from "@/lib/shared/analytics/track";
import { ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RoiOutputPanel } from "./roi-output-panel";
import cls from "./roi.module.css";

// Import LandingSection for consistent layout
import { LandingSection } from "../../layout/landing-section";

// Math & formatting moved to shared util (see imports above)

export const ROICalculator: React.FC = () => {
  const [leads, setLeads] = useState<number>(100);
  const [closeRate, setCloseRate] = useState<number>(20);
  const [dealSize, setDealSize] = useState<number>(20000);
  const [assumptionsOpen, setAssumptionsOpen] = useState<boolean>(false);
  const assumptionsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const assumptionsOverlayRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [assumptionsPos, setAssumptionsPos] = useState<{ left: number; top: number } | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updateAssumptionsPos = useCallback(() => {
    const el = assumptionsTriggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    // Keep the overlay within viewport bounds.
    const overlayWidth = 320;
    const margin = 16;
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - overlayWidth - margin);

    setAssumptionsPos({ left, top: rect.top });
  }, []);

  const openAssumptions = useCallback(() => {
    clearCloseTimer();
    updateAssumptionsPos();
    setAssumptionsOpen(true);
  }, [clearCloseTimer, updateAssumptionsPos]);

  const scheduleCloseAssumptions = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setAssumptionsOpen(false), 120);
  }, [clearCloseTimer]);

  // Keep overlay anchored on scroll/resize while open.
  useEffect(() => {
    if (!assumptionsOpen) return;
    updateAssumptionsPos();

    const onScroll = () => updateAssumptionsPos();
    const onResize = () => updateAssumptionsPos();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [assumptionsOpen, updateAssumptionsPos]);

  // Close on Escape / outside click.
  useEffect(() => {
    if (!assumptionsOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAssumptionsOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (assumptionsTriggerRef.current?.contains(target)) return;
      if (assumptionsOverlayRef.current?.contains(target)) return;
      setAssumptionsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [assumptionsOpen]);

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

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid gap-y-8 gap-x-8 lg:grid-cols-[minmax(240px,380px)_minmax(300px,480px)] xl:grid-cols-[minmax(280px,480px)_minmax(320px,560px)] justify-center items-start"
        >
          {/* Left: Input Card */}
          <div className="max-w-[560px] lg:max-w-[480px] xl:max-w-[560px] w-full mx-auto">
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
                  increaseAria="Increase leads identified by 10"
                  decreaseAria="Decrease leads identified by 10"
                  className={cls['numberField'] || ''}
                  ariaDescribedBy={`${ids.leads}-hint ${ids.leads}-microcopy`}
                  formatWithCommas
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
                    formatWithCommas
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

          {/* Right: Results */}
          <div className="max-w-[560px] lg:max-w-[480px] xl:max-w-[560px] w-full mx-auto flex flex-col">
            <RoiOutputPanel
              revenueGrowth={totalRevenue}
              newDeals={newDeals}
              workdaysSaved={workdaysSaved}
            />
            <div className="mt-4 text-sm text-left">
              <button
                ref={assumptionsTriggerRef}
                type="button"
                onMouseEnter={openAssumptions}
                onMouseLeave={scheduleCloseAssumptions}
                onFocus={openAssumptions}
                onBlur={scheduleCloseAssumptions}
                onClick={() => (assumptionsOpen ? setAssumptionsOpen(false) : openAssumptions())}
                aria-expanded={assumptionsOpen}
                aria-controls="roi-assumptions-overlay"
                className="inline-flex items-center gap-1 text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                title="View assumptions"
              >
                Assumptions
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform ${assumptionsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {assumptionsOpen && assumptionsPos && typeof document !== "undefined"
                ? createPortal(
                    <div
                      ref={assumptionsOverlayRef}
                      id="roi-assumptions-overlay"
                      role="dialog"
                      aria-label="ROI calculator assumptions"
                      onMouseEnter={openAssumptions}
                      onMouseLeave={scheduleCloseAssumptions}
                      style={{
                        left: assumptionsPos.left,
                        top: assumptionsPos.top,
                        transform: "translateY(calc(-100% - 8px))",
                      }}
                      className="fixed z-[80] w-[320px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-3 text-sm leading-normal text-popover-foreground shadow-lg"
                    >
                      <ul className="list-disc pl-4 space-y-1">
                        <li>We assume ~2 hours saved per lead.</li>
                        <li>8 hours = 1 workday.</li>
                        <li>New Deals = Leads × (Close Rate/100).</li>
                        <li>Revenue = New Deals × Avg. Deal Size.</li>
                      </ul>
                    </div>,
                    document.body
                  )
                : null}
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
};

// OutputCard removed; replaced by ROIOutputCard


