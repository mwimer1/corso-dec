// components/ui/organisms/navbar/navbar.tsx
"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import * as React from "react";

import { Logo } from "@/components/ui/atoms";
import { APP_LINKS } from '@/lib/shared';
import { cn, cls } from "@/styles";
import { navbarLogoVariants } from "@/styles/ui/organisms";
import { navbarStyleVariants } from "@/styles/ui/organisms/navbar-variants";
import type { NavItemData } from "@/types/shared";
import { UserButton } from "@clerk/nextjs";
import { landingNavItems as defaultLandingNavItems } from './links';
import { resolveNavItems } from './navbar-helpers';
import { NavbarMenu } from './navbar-menu';
import { Ctas } from './shared';


interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  mode?: "app" | "landing" | "minimal" | "insights";
  /** Optional override for primary nav items (domain-provided) */
  items?: NavItemData[] | undefined;
  /** Force show CTAs regardless of authentication state (for landing pages) */
  forceShowCTAs?: boolean;
  /** Whether to show breadcrumb navigation (for insights pages) */
  showBreadcrumbs?: boolean;
  /** Custom breadcrumbs to display */
  breadcrumbs?: NavItemData[] | undefined;
  /** Callback to sync scroll state to parent (for PublicLayout header styling) */
  onScrolledChange?: (scrolled: boolean) => void;
}

export function Navbar({
  className,
  mode = "landing",
  items,
  forceShowCTAs = false,
  showBreadcrumbs = false,
  breadcrumbs,
  onScrolledChange
}: NavbarProps) {
  const { isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    // IntersectionObserver for scroll detection
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          const newScrolled = !entry.isIntersecting;
          setScrolled(newScrolled);
          // Sync scroll state to parent (PublicLayout) for header styling
          onScrolledChange?.(newScrolled);
        }
      },
      { root: null, threshold: 0, rootMargin: "-150px 0px 0px 0px" }
    );
    io.observe(el);

    // Expose nav height as a CSS variable so other components (sticky elements)
    // can position themselves exactly under the navbar. Use a ResizeObserver
    // to update on layout changes (mobile menu, font changes, etc.).
    const header = document.querySelector('header[role="banner"], header');
    let ro: ResizeObserver | null = null;
    let applyNavOffset: (() => void) | null = null;

    if (header) {
      applyNavOffset = () => {
        const h = Math.ceil((header as HTMLElement).getBoundingClientRect().height);
        // set --nav-offset for sticky top positioning and --nav-h for full-page layout helpers
        document.documentElement.style.setProperty('--nav-offset', `${h}px`);
        document.documentElement.style.setProperty('--nav-h', `${h}px`);
      };
      applyNavOffset();
      ro = new ResizeObserver(applyNavOffset);
      ro.observe(header);
      window.addEventListener('resize', applyNavOffset);
    }

    // Standard cleanup function
    return () => {
      io.disconnect();
      if (ro) {
        try {
          ro.disconnect();
        } catch {
          // Ignore errors during cleanup
        }
      }
      if (applyNavOffset) {
        try {
          window.removeEventListener('resize', applyNavOffset);
        } catch {
          // Ignore errors during cleanup
        }
      }
    };
  }, [onScrolledChange]);

  // Use canonical landingNavItems from links.ts (single source of truth)
  const landingNavItems = defaultLandingNavItems;

  const appNavItems: NavItemData[] = [
    { href: APP_LINKS.DASHBOARD.PROJECTS.replace('/projects',''), label: "Dashboard" },
  ];

  const navItems = resolveNavItems({
    items,
    mode,
    appNavItems,
    landingNavItems,
  });

  const navbarStyles = navbarStyleVariants({ scrolled });

  return (
    <>
      <header
        data-scrolled={scrolled ? 'true' : 'false'}
        className={cn(
          cls(navbarStyles.navbar),
          scrolled && cls(navbarStyles.navbarScrolled),
          'px-0',
          className
        )}
      >
        <div className={cls(navbarStyles.container)}>
          {/* Left cluster: Logo + primary navigation */}
          <div className={cls(navbarStyles.left)}>
            <Link
              href={APP_LINKS.NAV.HOME}
              aria-label="Corso home"
              className={cn(cls(navbarStyles.logoLink), cls(navbarLogoVariants), "mr-md")}
            >
              <Logo />
            </Link>

            {/* Breadcrumbs for insights pages */}
            {showBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2 text-sm text-muted-foreground mr-md" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    {index > 0 && <span className="text-muted-foreground">/</span>}
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Desktop nav items */}
            {mode !== "minimal" && (
              <nav className={cls(navbarStyles.desktopNav)} aria-label="Primary navigation">
                <NavbarMenu
                  items={navItems}
                  isMobileMenuOpen={isMobileMenuOpen}
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                  isSignedIn={isSignedIn ?? false}
                  variant={mode as "app" | "landing"}
                  section="items"
                />
              </nav>
            )}
          </div>

          {/* Right cluster: auth actions */}
          {mode === "minimal" ? (
            <div className={cls(navbarStyles.right)}>
              <Ctas className={cls(navbarStyles.button)} />
            </div>
          ) : (
            <div className={cls(navbarStyles.right)}>
              {/* Never show UserButton on public marketing pages (landing/insights) - authenticated users should be redirected */}
              {(forceShowCTAs || mode === "landing" || mode === "insights") ? (
                <Ctas className={cls(navbarStyles.button)} />
              ) : isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <Ctas className={cls(navbarStyles.button)} />
              )}
            </div>
          )}

          {/* Mobile menu trigger and content */}
          <div className={cls(navbarStyles.mobileTriggerContainer)}>
            <NavbarMenu
              items={navItems}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              isSignedIn={isSignedIn ?? false}
              variant={mode === "insights" ? "landing" : mode as "app" | "landing"}
              section="mobile"
            />
          </div>
        </div>
      </header>

      {/* Sentinel for scroll shadow (toggle after ~150px) */}
      <div ref={sentinelRef} className={cls(navbarStyles.sentinel)} aria-hidden="true" />
    </>
  );
}


