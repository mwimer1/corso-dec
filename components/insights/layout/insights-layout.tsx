"use client";

// components/insights/layout/insights-layout.tsx
// Insights page layout wrapper providing consistent structure for insights pages

import { SkipNavLink } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/button";
import { LinkTrack } from "@/components/ui/molecules";
import { Footer } from "@/components/ui/organisms";
import { APP_LINKS } from '@/lib/shared';
import { cn } from "@/styles";
import { fullWidthSectionContainerVariants } from "@/styles/ui/organisms";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import type { NavItemData } from "@/types/shared";
import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import { InsightsNavbar } from "./navbar";

interface InsightsLayoutProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Enable sticky header with blur and border */
  stickyHeader?: boolean;
  /** Optional additional classes for the header wrapper */
  headerClassName?: string;
  /** Whether to show breadcrumb navigation (for article pages) */
  showBreadcrumbs?: boolean;
  /** Custom navigation items override */
  navItems?: NavItemData[];
  /** Whether to show reading progress indicator (for article pages) */
  showReadingProgress?: boolean;
}

function InsightsLayout({
  children,
  className,
  stickyHeader = true,
  headerClassName,
  showBreadcrumbs: _showBreadcrumbs = false,
  navItems,
  showReadingProgress = false,
  ...props
}: InsightsLayoutProps): JSX.Element {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col">
      <SkipNavLink />
      <header
        role="banner"
        data-sticky-nav
        data-scrolled={scrolled ? 'true' : 'false'}
        className={cn(
          stickyHeader &&
            "sticky top-0 z-50 border-b border-border bg-surface transition-shadow data-[scrolled=true]:shadow-sm",
          headerClassName,
        )}
      >
        <div
          className={cn(
            containerMaxWidthVariants({ maxWidth: "7xl", centered: true })
          )}
        >
          <InsightsNavbar
            items={navItems && navItems.length > 0 ? navItems : undefined}
            showBreadcrumbs={false} // Never show breadcrumbs in insights layout - use logo for home navigation
            className="w-full"
          />
        </div>
      </header>
      <main
        id="main-content"
        className={cn(
          "bg-background text-foreground flex-1 relative min-h-screen",
          showReadingProgress && "pt-4", // Account for reading progress bar
          className,
        )}
        {...props}
      >
        {/* Page-level continuous vertical guidelines overlay (scoped to main; excludes footer) */}
        <div className={cn('pointer-events-none absolute inset-0 z-[39]')} aria-hidden="true">
          <div className={cn(fullWidthSectionContainerVariants({ maxWidth: '7xl', padding: 'lg' }), 'relative h-full w-full mx-auto')}>
            <div className="absolute inset-y-0 left-0 w-px bg-border" />
            <div className="absolute inset-y-0 right-0 w-px bg-border" />
          </div>
        </div>

        {children}
      </main>
      {/* Sticky mobile CTA ribbon - same as landing page */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:hidden">
        <div className={cn(containerMaxWidthVariants({ maxWidth: "7xl", centered: true }), "px-4 py-3 flex items-center justify-between gap-3")}>
          <span className="text-sm text-muted-foreground">Ready to explore Corso?</span>
          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="secondary">
              <LinkTrack href={APP_LINKS.NAV.SIGNIN} label="landing:mobile:signin">Sign in</LinkTrack>
            </Button>
            <Button asChild size="sm">
              <LinkTrack href={APP_LINKS.NAV.SIGNUP} label="landing:mobile:signup">Start for free</LinkTrack>
            </Button>
          </div>
        </div>
      </div>
      {/* Same footer as landing page */}
      <Footer showCTA />
    </div>
  );
}

export default InsightsLayout;
export { InsightsLayout };
