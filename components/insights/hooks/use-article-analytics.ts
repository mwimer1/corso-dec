"use client";

// components/insights/hooks/use-article-analytics.ts
// Client-only analytics for article engagement using shared, edge-safe tracker
import { trackEvent } from "@/lib/shared/analytics/track";
import * as React from "react";

// Lightweight debounce helper to avoid adding lodash dependency
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => {
    if (t) clearTimeout(t);
    t = null;
  };
  debounced.flush = () => {
    if (t) {
      clearTimeout(t);
      t = null;
      // no-op for flush since original fn isn't stored args here
    }
  };
  return debounced as T & { cancel: () => void; flush: () => void };
}

interface UseArticleAnalyticsOptions {
  slug: string;
  title: string;
  categories?: string[] | undefined;
  authorName?: string | undefined;
  publishDate?: string | null | undefined;
}

/**
 * Tracks article view, scroll depth quartiles, and time-on-page milestones.
 * Automatically respects consent via shared tracker and never throws.
 */
export function useArticleAnalytics(options: UseArticleAnalyticsOptions): void {
  const { slug, title, categories, authorName, publishDate } = options;

  const milestonesFiredRef = React.useRef<{ scroll: Set<number>; time30: boolean; time120: boolean }>({
    scroll: new Set<number>(),
    time30: false,
    time120: false,
  });

  // Extract UTM params once on mount for attribution
  const utmRef = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const known = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
      const out: Record<string, string> = {};
      for (const key of known) {
        const v = params.get(key);
        if (v) out[key] = v;
      }
      utmRef.current = out;
    } catch {
      utmRef.current = {};
    }
  }, []);

  // Initial view event
  React.useEffect(() => {
    trackEvent("insight_view", {
      slug,
      title,
      categories,
      author: authorName,
      publishDate,
      ...utmRef.current,
    });
    // do not re-fire
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Memoize milestones for performance (top level)
  const milestones = React.useMemo(() => [25, 50, 75, 100], []);

  // Memoize debounced scroll handler (top level)
  const debouncedTrackScroll = React.useMemo(() => debounce((pct: number) => {
    for (const milestone of milestones) {
      if (pct >= milestone && !milestonesFiredRef.current.scroll.has(milestone)) {
        milestonesFiredRef.current.scroll.add(milestone);
        trackEvent("insight_scroll_depth", { slug, title, milestone });
      }
    }
  }, 100), [slug, title, milestones]);

  // Scroll depth tracking at 25/50/75/100% - optimized with debouncing
  React.useEffect(() => {
    const computePercent = (): number => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return 100;
      return Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
    };

    const onScroll = (): void => {
      const pct = computePercent();
      debouncedTrackScroll(pct);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Fire once to capture initial state on short pages
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      debouncedTrackScroll.cancel();
    };
  }, [slug, title, debouncedTrackScroll]);

  // Memoize time milestone tracker (top level)
  const trackTimeMilestone = React.useCallback((seconds: number) => {
    const timeKey = seconds === 30 ? 'time30' : 'time120';
    if (!milestonesFiredRef.current[timeKey as keyof typeof milestonesFiredRef.current]) {
      (milestonesFiredRef.current[timeKey as keyof typeof milestonesFiredRef.current] as boolean) = true;
      trackEvent("insight_time_on_page", { slug, title, seconds });
    }
  }, [slug, title]);

  // Time on page milestones (30s, 120s)
  React.useEffect(() => {
    const t30 = window.setTimeout(() => trackTimeMilestone(30), 30_000);
    const t120 = window.setTimeout(() => trackTimeMilestone(120), 120_000);

    return () => {
      window.clearTimeout(t30);
      window.clearTimeout(t120);
    };
  }, [slug, title, trackTimeMilestone]);
}



