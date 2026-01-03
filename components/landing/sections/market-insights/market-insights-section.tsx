"use client";

// src/components/landing/market-insights/market-insights-section.tsx

import { Button, Card, CardContent } from "@/components/ui/atoms";
import { Badge } from "@/components/ui/atoms/badge";
import { trackEvent } from "@/lib/shared/analytics/track";
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import type { ChartDataPoint } from "@/types/marketing";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { averageJobValue, filterSeries, getRangeSlice, sumJobValue, sumProjectCount } from "../../utils/data";
import { FilterPills } from "../../widgets/filter-pills";
import { FilterSelect } from "../../widgets/filter-select";
import { Statistics } from "../../widgets/statistics";
import { DEFAULT_DATA } from "./chart-data";
import styles from './market-insights.module.css';
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
  stickyMetrics: _stickyMetrics = false,
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
  const handleReset = useCallback(() => {
    const defaultTerritory = territories[0] ?? "Texas";
    const defaultProperty = propertyTypes[0] ?? "All";
    setTerritory(defaultTerritory);
    setPropType(defaultProperty);
    const defaultLow = Math.max(minYear, maxYear - 9);
    const defaultHigh = maxYear;
    setRange([defaultLow, defaultHigh]);
    try { trackEvent("insights_filters_reset", {}); } catch {}
    updateUrl({
      ...(defaultTerritory && { territory: defaultTerritory }),
      ...(defaultProperty && { property: defaultProperty }),
      minYear: defaultLow,
      maxYear: defaultHigh
    });
  }, [territories, propertyTypes, minYear, maxYear, updateUrl]);

  return (
    <section
      className={cn(
        containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }),
        styles['section']
      )}
      aria-labelledby="market-insights-title"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">
        {/* LEFT COLUMN: Text + Filters */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Text header section */}
          <div className="max-w-prose">
            <h2 id="market-insights-title" className="text-4xl font-bold tracking-tight text-foreground">
              Explore Real Data in Action
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              See how Corso transforms building-permit data into actionable business intelligence across different views.
            </p>
            <ul className="list-disc list-outside pl-5 mt-6 space-y-2 text-muted-foreground">
              <li>Filter by territory, property type, and year range</li>
              <li>Compare job value vs. project count</li>
              <li>Export-ready insights for GTM teams</li>
            </ul>
          </div>

          {/* Filters Card - positioned below bullet points */}
          <Card variant="default" className="mt-6 flex-1">
            <CardContent className="space-y-4 pt-6">
              {/* Filter controls */}
              <div className="space-y-4">
                <YearRangeSlider
                  value={range}
                  onChange={setRange}
                  onCommit={onRangeCommit}
                  minYear={minYear}
                  maxYear={maxYear}
                  compact
                  showSelectedIndicator={false}
                  {...(!dense ? {} : { showBubbles: false })}
                />

                {controlsVariant === "dropdown" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FilterSelect
                      title="Select Territory"
                      items={territories}
                      selected={territory}
                      onSelect={onTerritorySelect}
                      id="territory-select"
                      showSelectedIndicator={false}
                    />
                    <FilterSelect
                      title="Select Property Type"
                      items={propertyTypes}
                      selected={propType}
                      onSelect={onPropertySelect}
                      id="property-select"
                      showSelectedIndicator={false}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FilterPills
                      title="Select Territory"
                      items={territories}
                      selected={territory}
                      onSelect={onTerritorySelect}
                      id="territory-pills"
                      showSelectedIndicator={false}
                    />
                    <FilterPills
                      title="Select Property Type"
                      items={propertyTypes}
                      selected={propType}
                      onSelect={onPropertySelect}
                      id="property-pills"
                      showSelectedIndicator={false}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    Reset
                  </Button>

                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    Sample view • Updated regularly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Chart output with stats */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card variant="highlight" className="h-full flex flex-col">
            <CardContent className="pt-6 flex-1 flex flex-col">
              {/* Statistics at top */}
              <Statistics
                totalProjects={totalProjects}
                totalJobValue={totalJobValue}
                averageJobValue={avgJobValue}
                valueClassName="text-primary"
                compact
                className="border-b-0 py-0 mt-0 mb-3"
              />
              {/* Chart */}
              <Chart data={filtered} loading={loading} variant="bare" heightClassName="h-64 md:h-80 lg:h-96" />
              {/* Active filters at bottom */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-sm font-semibold text-foreground">Selected filters</p>
                <div className="flex flex-wrap gap-2" aria-label="Active filters">
                  <Badge color="secondary">{territory}</Badge>
                  <Badge color="secondary">{propType === "All" ? "All Types" : propType}</Badge>
                  <Badge color="secondary">{range[0]}–{range[1]}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className={"mt-8 pt-8 " + styles['roiWrap']}>
        <ROICalculator />
      </div>
    </section>
  );
};
