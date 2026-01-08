"use client";

// components/insights/layout/insights-section.tsx
import { SectionShell } from "@/components/ui/patterns";
import * as React from "react";

type InsightsSectionTone = "surface" | "muted" | "brand" | "dark";

interface InsightsSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Background tone for the section */
  tone?: InsightsSectionTone;
  /** Enable vertical guidelines for development */
  guidelines?: React.ReactNode;
  /** Show reading progress indicator (for article pages) */
  showReadingProgress?: boolean;
  /** Custom reading progress component */
  readingProgress?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function InsightsSection({
  tone = "surface",
  guidelines,
  showReadingProgress = false,
  readingProgress,
  className,
  children,
  ...rest
}: InsightsSectionProps): JSX.Element {
  return (
    <SectionShell
      tone={tone}
      {...(guidelines ? { guidelines } : {})}
      className={className}
      {...rest}
    >
      {showReadingProgress && (readingProgress || <ReadingProgress />)}
      {children}
    </SectionShell>
  );
}

// Enhanced reading progress indicator component using Intersection Observer
function ReadingProgress(): JSX.Element {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // Use Intersection Observer for better performance and accuracy
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Calculate progress based on intersection ratio and viewport
            const scrollPercent = Math.min(100, Math.max(0, entry.intersectionRatio * 100));
            setProgress(scrollPercent);
          }
        });
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '0px 0px -100% 0px' // Observe from top of viewport
      }
    );

    // Observe the main content area
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      observer.observe(mainContent);
    }

    // Fallback: calculate initial progress
    const updateProgress = (): void => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    updateProgress(); // Initial calculation

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default InsightsSection;
