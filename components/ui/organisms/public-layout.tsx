"use client";

import { Button, SkipNavLink } from "@/components/ui/atoms";
import { APP_LINKS } from '@/lib/shared';
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import type { NavItemData } from "@/types/shared";
import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import FooterSystem from "./footer-system/footer";
import { Navbar } from "./navbar/navbar";

interface PublicLayoutProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Navigation mode - determines what nav items and buttons to show */
  navMode?: "landing" | "minimal";
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
  ...props
}: PublicLayoutProps): JSX.Element {
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
          <Navbar mode={navMode} {...(navItems && { items: navItems })} />
        </div>
      </header>
      <main
        id="main-content"
        className={`bg-background text-foreground flex-1 ${className ?? ""}`}
        {...props}
      >
        {children}
      </main>

      {/* Sticky mobile CTA ribbon */}
      {showMobileCTA && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:hidden">
          <div className={cn(containerMaxWidthVariants({ maxWidth: "7xl", centered: true }), "px-4 py-3 flex items-center justify-between gap-3")}>
            <span className="text-sm text-muted-foreground">Ready to explore Corso?</span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link href={APP_LINKS.NAV.SIGNIN}>Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={APP_LINKS.NAV.SIGNUP}>Start for free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <FooterSystem showCTA={showFooterCTA} />
    </div>
  );
}


