"use client";

// components/marketing/landing/landing-layout.tsx
// Fixes: TS2724 – adds and exports LandingLayoutProps type.
// Client component: Uses React hooks (useEffect, useState) for scroll-based header styling

import { SkipNavLink } from "@/components/ui/atoms";
import { Footer } from "@/components/ui/organisms";
import { cn } from "@/styles";
import { fullWidthSectionContainerVariants } from "@/styles/ui/organisms";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import { landingNavItems } from "./nav.config";
import { LandingNavbar } from "./navbar";
// Removed FinalCTA in favor of FooterSystem's integrated FooterCTA
import { Button } from "@/components/ui/atoms/button";
import { APP_LINKS } from '@/lib/shared';
// Link is no longer used; LinkTrack is used for tracked CTAs
import { LinkTrack } from "@/components/ui/molecules";

interface LandingLayoutProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Enable sticky header with blur and border (no JS scroll state) */
  stickyHeader?: boolean;
  /** Optional additional classes for the header wrapper */
  headerClassName?: string;
}

function LandingLayout({
  children,
  className,
  stickyHeader = true,
  headerClassName,
  ...props
}: LandingLayoutProps): JSX.Element {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-[100svh] flex flex-col">
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
          <LandingNavbar items={landingNavItems} />
        </div>
      </header>
      <main
        id="main-content"
        className={`bg-background text-foreground flex-1 relative ${className ?? ""}`}
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
      {/* Sticky mobile CTA ribbon */}
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
      <Footer showCTA />
    </div>
  );
}

export default LandingLayout;
export { LandingLayout };

