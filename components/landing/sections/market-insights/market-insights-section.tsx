"use client";

// src/components/landing/market-insights/market-insights-section.tsx

import { SectionHeader } from "@/components/ui/patterns";
import { trackEvent } from "@/lib/shared/analytics/track";
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import { surfaceInteractive } from "@/styles/ui/shared/surface-interactive";
import type { ChartDataPoint } from "@/types/marketing";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { averageJobValue, filterSeries, getRangeSlice, sumJobValue, sumProjectCount } from "../../utils/data";
import { FilterPills } from "../../widgets/filter-pills";
import { FilterSelect } from "../../widgets/filter-select";
import { Statistics } from "../../widgets/statistics";
import { DEFAULT_DATA } from "./chart-data";
import cls from './market-insights.module.css';
// ROI calculator is rendered client-only to avoid SSR/client drift with browser extensions
const ROICalculator = dynamic(
  () => import("../roi/roi-calculator").then(m => m.ROICalculator),
  { ssr: false }
);
// Render slider client-only to avoid SSR/client attribute drift
const YearRangeSlider = dynamic(() => import("../../widgets/year-range-slider").then(m => m.YearRangeSlider), { ssr: false });
const Chart = dynamic(() => import("../../widgets/chart").then(m => m.Chart), {
  ssr: false,
  loading: () => <div className="bg-surface rounded-xl shadow-md border border-border p-6 mb-8 h-64 md:h-80 animate-pulse motion-reduce:animate-none motion-reduce:transition-none" />
});

type Props = {
  /** Full time series for TX by default; we simulate territory/property filters locally */
  data?: ChartDataPoint[];
  territories?: string[];
  propertyTypes?: string[];
  /** Controls rendering variant (safe default: pills) */
  controlsVariant?: "pills" | "dropdown";
  /** Dense mode trims spacing and hides slider bubbles */
  dense?: boolean;
  /** Keep statistics visible while adjusting controls (md+ only) */
  stickyMetrics?: boolean;
};

const DEFAULT_TERRITORIES = ["Texas","Austin","Houston","Dallas","Fort Worth","San Antonio"];
const DEFAULT_PROPERTY_TYPES = ["All","Commercial","Other","Public Works","Residential","Industrial","Vacant Land","Agriculture"];

// DEFAULT_DATA moved to dedicated module for testability and clarity

export const MarketInsightsSection: React.FC<Props> = ({
  data = DEFAULT_DATA,
  territories = DEFAULT_TERRITORIES,
  propertyTypes = DEFAULT_PROPERTY_TYPES,
  controlsVariant = "pills",
  dense = false,
  stickyMetrics = false,
}) => {
  const minYear = useMemo(() => Math.min(...data.map((d: ChartDataPoint) => d.year)), [data]);
  const maxYear = useMemo(() => Math.max(...data.map((d: ChartDataPoint) => d.year)), [data]);

  const [territory, setTerritory] = useState<string>(territories[0] ?? "Texas");
  const [propType, setPropType] = useState<string>(propertyTypes[0] ?? "All");
  const [range, setRange] = useState<[number, number]>([Math.max(minYear, maxYear - 9), maxYear]); // last ~10y by default
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<ChartDataPoint[]>(data);

  // Initialize state from URL query params (client-only)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("territory");
      const p = params.get("property");
      const minStr = params.get("minYear");
      const maxStr = params.get("maxYear");
      if (t && territories.includes(t)) setTerritory(t);
      if (p && propertyTypes.includes(p)) setPropType(p);
      // Only parse when present; Number(null) === 0 (buggy default)
      const defaultLow = Math.max(minYear, maxYear - 9);
      const defaultHigh = maxYear;
      const parsedMin = minStr !== null ? Number(minStr) : NaN;
      const parsedMax = maxStr !== null ? Number(maxStr) : NaN;
      let low = defaultLow;
      let high = defaultHigh;
      if (!Number.isNaN(parsedMin)) {
        low = Math.max(minYear, Math.min(maxYear, parsedMin));
      }
      if (!Number.isNaN(parsedMax)) {
        high = Math.max(minYear, Math.min(maxYear, parsedMax));
      }
      if (low > high) {
        // Ensure valid ordering
        const tmp = low; low = high; high = tmp;
      }
      if (!Number.isNaN(parsedMin) || !Number.isNaN(parsedMax)) {
        setRange([low, high]);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated fetching when territory/property changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 450));
      const next = filterSeries([...data], {
        isDefaultTerritory: territory === territories[0],
        isAllPropertyType: propType === "All",
      });
      if (mounted) { setSeries(next); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [territory, propType, data, territories]);

  const filtered = useMemo(() => getRangeSlice(series, range), [series, range]);
  const totalProjects = useMemo(() => sumProjectCount(filtered), [filtered]);
  const totalJobValue = useMemo(() => sumJobValue(filtered), [filtered]);
  const avgJobValue = useMemo(() => averageJobValue(filtered), [filtered]);

  const updateUrl = useCallback((next: {
    territory?: string;
    property?: string;
    minYear?: number;
    maxYear?: number;
  }) => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (next.territory) params.set("territory", next.territory);
      if (next.property) params.set("property", next.property);
      if (typeof next.minYear === "number") params.set("minYear", String(next.minYear));
      if (typeof next.maxYear === "number") params.set("maxYear", String(next.maxYear));
      const qs = params.toString();
      const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    } catch {}
  }, []);

  // Add small scroll listener to toggle 'scrolled' class on sticky stats wrapper
  const stickyRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.getElementById('market-insights-sticky-stats');
    if (!el) return;
    stickyRef.current = el;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const offset = window.scrollY || window.pageYOffset;
        // When scrolled more than 48px, apply compact mode
        if (offset > 48) {
          el.classList.add('scrolled');
        } else {
          el.classList.remove('scrolled');
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // run once to set initial state
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const onTerritorySelect = useCallback((t: string) => {
    setTerritory(t);
    try { trackEvent("insights_filter_changed", { territory: t, propertyType: propType }); } catch {}
    updateUrl({ territory: t });
  }, [propType, updateUrl]);

  const onPropertySelect = useCallback((p: string) => {
    setPropType(p);
    try { trackEvent("insights_filter_changed", { territory, propertyType: p }); } catch {}
    updateUrl({ property: p });
  }, [territory, updateUrl]);

  const onRangeCommit = useCallback((r: [number, number]) => {
    try { trackEvent("insights_range_changed", { minYear: r[0], maxYear: r[1] }); } catch {}
    updateUrl({ minYear: r[0], maxYear: r[1] });
  }, [updateUrl]);

  const controlsSpacing = dense ? "space-y-4" : "space-y-6";
  const controlsGap = dense ? "gap-4" : "gap-6";

  return (
    <section 
      className={cn(
        containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }),
        cls['section']
      )}
      aria-labelledby="market-insights-title"
    >
      {/* Reduced header margin from mb-5xl to mb-4xl for tighter spacing (~80px instead of ~96px) */}
      <div className="mx-auto max-w-4xl text-center mb-4xl">
        <SectionHeader
          id="market-insights-title"
          headingLevel={2}
          align="center"
          title={"Explore Real Data in Action"}
          subtitle={"See how Corso transforms building-permit data into actionable business intelligence across different views."}
          size={"marketingHero"}
        />
      </div>

      {/* Consolidated spacing: removed mb-6, relying on controls container's mt-8 for consistent 32px gap */}
      <div>
        {stickyMetrics ? (
          <div className="hidden md:block sticky z-20" style={{ top: 'var(--nav-offset, 0px)' }}>
            {/* wrapper uses module CSS to handle shrink-on-scroll */}
            <div className={cn("bg-surface/95 supports-[backdrop-filter]:bg-surface/80 backdrop-blur-md rounded-xl border border-border shadow-md px-4 py-2", cls['stickyStatsWrapper'])} id="market-insights-sticky-stats">
              <div className="statsInner">
                <Statistics totalProjects={totalProjects} totalJobValue={totalJobValue} averageJobValue={avgJobValue} valueClassName="text-primary" compact className="border-b-0" />
              </div>
            </div>
          </div>
        ) : (
          <Statistics totalProjects={totalProjects} totalJobValue={totalJobValue} averageJobValue={avgJobValue} valueClassName="text-primary" />
        )}
        <Chart data={filtered} loading={loading} variant="bare" />
      </div>

      {/* Controls Section with Visual Grouping - mt-8 provides 32px gap from chart above */}
      <div className={cn("bg-surface/50 border border-border rounded-xl p-6 mt-8 mb-8 shadow-sm", surfaceInteractive({ elevate: true }), cls['controlsContainer'])}>
        <div className={controlsSpacing}>
          {/* Wide layout: slider left (≈50%), filters right; stacks on small screens */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 ${controlsGap} items-start lg:items-center`}>
            <div className="lg:col-span-1 lg:max-w-[48ch]">
              <YearRangeSlider value={range} onChange={setRange} onCommit={onRangeCommit} minYear={minYear} maxYear={maxYear} {...(!dense ? {} : { showBubbles: false })} compact />
            </div>
            <div className="lg:col-span-1">
              <div className={`grid grid-cols-1 lg:grid-cols-2 ${controlsGap}`}>
                {controlsVariant === "dropdown" ? (
                  <>
                    <FilterSelect
                      title="Select Territory"
                      items={territories}
                      {...(territory !== undefined && { selected: territory })}
                      onSelect={onTerritorySelect}
                      id="territory-select"
                    />
                    <FilterSelect
                      title="Select Property Type"
                      items={propertyTypes}
                      {...(propType !== undefined && { selected: propType })}
                      onSelect={onPropertySelect}
                      id="property-select"
                    />
                  </>
                ) : (
                  <>
                    <FilterPills
                      title="Select Territory"
                      items={territories}
                      {...(territory !== undefined && { selected: territory })}
                      onSelect={onTerritorySelect}
                      id="territory-pills"
                    />
                    <FilterPills
                      title="Select Property Type"
                      items={propertyTypes}
                      {...(propType !== undefined && { selected: propType })}
                      onSelect={onPropertySelect}
                      id="property-pills"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={"mt-8 pt-8 " + cls['roiWrap']}>
        <ROICalculator />
      </div>
    </section>
  );
};
