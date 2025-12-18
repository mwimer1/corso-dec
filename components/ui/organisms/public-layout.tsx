"use client";

import { Button, SkipNavLink } from "@/components/ui/atoms";
import { LinkTrack, ReadingProgress } from "@/components/ui/molecules";
import { APP_LINKS } from '@/lib/shared';
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import { containerWithPaddingVariants } from "@/styles/ui/shared/container-helpers";
import type { NavItemData } from "@/types/shared";
import { useAuth } from "@clerk/nextjs";
import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import FooterSystem from "./footer-system/footer";
import { Navbar } from "./navbar/navbar";

interface PublicLayoutProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Navigation mode - determines what nav items and buttons to show */
  navMode?: "landing" | "minimal" | "insights";
  /** Custom navigation items (optional override) */
  navItems?: NavItemData[];
  /** Enable sticky header with blur and border (no JS scroll state) */
  stickyHeader?: boolean;
  /** Optional additional classes for the header wrapper */
  headerClassName?: string;
  /** Show footer CTA section */
  showFooterCTA?: boolean;
  /** Show mobile sticky CTA ribbon */
  showMobileCTA?: boolean;
  /** Whether to show reading progress indicator (for insights article pages) */
  showReadingProgress?: boolean;
  /** Whether to show vertical guidelines overlay */
  showVerticalGuidelines?: boolean;
}

/**
 * PublicLayout - Shared layout for all public marketing pages.
 * Provides consistent navbar, footer, and mobile CTA patterns.
 */
export function PublicLayout({
  children,
  className,
  navMode = "landing",
  navItems,
  stickyHeader = true,
  headerClassName,
  showFooterCTA = true,
  showMobileCTA = true,
  showReadingProgress = false,
  showVerticalGuidelines = false,
  ...props
}: PublicLayoutProps): React.ReactElement {
  const { isSignedIn } = useAuth();
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
    <div className="flex min-h-screen flex-col">
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
            containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" })
          )}
        >
          <Navbar 
            mode={navMode} 
            {...(navItems && { items: navItems })}
            {...(navMode === "insights" || navMode === "landing" ? { forceShowCTAs: true } : {})}
          />
        </div>
      </header>
      {showReadingProgress && <ReadingProgress />}
      <main
        id="main-content"
        className={cn(
          "flex-1 relative bg-background text-foreground overflow-x-hidden",
          showReadingProgress && "pt-1", // Account for reading progress bar (1px height)
          !isSignedIn && showMobileCTA && "pb-20", // Prevent footer overlap with mobile CTA
          className,
        )}
        {...props}
      >
        {/* Page-level continuous vertical guidelines overlay (scoped to main; excludes footer) */}
        {showVerticalGuidelines && (
          <div className={cn('pointer-events-none absolute inset-0 z-[39]')} aria-hidden="true">
            <div className={cn(
              containerMaxWidthVariants({ maxWidth: '7xl', centered: true }),
              'relative h-full mx-auto'
            )}>
              {/* Left guideline positioned at inner edge of padding (px-4 sm:px-6 lg:px-8) */}
              <div className="absolute inset-y-0 left-4 sm:left-6 lg:left-8 w-px bg-border" />
              {/* Right guideline positioned at inner edge of padding (px-4 sm:px-6 lg:px-8) */}
              <div className="absolute inset-y-0 right-4 sm:right-6 lg:right-8 w-px bg-border" />
            </div>
          </div>
        )}

        {children}
      </main>

      {/* Sticky mobile CTA ribbon */}
      {showMobileCTA && !isSignedIn && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:hidden">
          <div className={cn(containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" }), "py-3 flex items-center justify-between gap-3")}>
            <span className="text-sm text-muted-foreground">Ready to explore Corso?</span>
            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="secondary">
                <LinkTrack href={APP_LINKS.NAV.SIGNIN} label="landing:mobile:signin">Sign in</LinkTrack>
              </Button>
              <Button asChild size="sm" variant="cta">
                <LinkTrack href={APP_LINKS.NAV.SIGNUP} label="landing:mobile:signup">Start for free</LinkTrack>
              </Button>
            </div>
          </div>
        </div>
      )}

      <FooterSystem showCTA={showFooterCTA} />
    </div>
  );
}


