// components/ui/organisms/navbar/navbar.tsx
"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import * as React from "react";

import { Logo } from "@/components/ui/atoms";
import { APP_LINKS } from '@/lib/shared';
import { cn } from "@/styles";
import { navbarLogoVariants } from "@/styles/ui/organisms";
import { navbarLayout } from "@/styles/ui/organisms/navbar-layout";
import { navbarStyleVariants } from "@/styles/ui/organisms/navbar-variants";
import type { NavItemData } from "@/types/shared";
import { UserButton } from "@clerk/nextjs";
import { PRIMARY_LINKS } from './links';
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
}

export function Navbar({
  className,
  mode = "landing",
  items,
  forceShowCTAs = false,
  showBreadcrumbs = false,
  breadcrumbs
}: NavbarProps) {
  const { isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setScrolled(!entry.isIntersecting);
        }
      },
      { root: null, threshold: 0, rootMargin: "-150px 0px 0px 0px" }
    );
    io.observe(el);
    // Expose nav height as a CSS variable so other components (sticky elements)
    // can position themselves exactly under the navbar. Use a ResizeObserver
    // to update on layout changes (mobile menu, font changes, etc.).
    const header = document.querySelector('header[role="banner"], header');
    if (header) {
      const applyNavOffset = () => {
        const h = Math.ceil((header as HTMLElement).getBoundingClientRect().height);
        // set --nav-offset for sticky top positioning and --nav-h for full-page layout helpers
        document.documentElement.style.setProperty('--nav-offset', `${h}px`);
        document.documentElement.style.setProperty('--nav-h', `${h}px`);
      };
      applyNavOffset();
      const ro = new ResizeObserver(applyNavOffset);
      ro.observe(header);
      window.addEventListener('resize', applyNavOffset);
      // cleanup on unmount
      io.disconnect = ((orig) => () => {
        try { ro.disconnect(); } catch {}
        try { window.removeEventListener('resize', applyNavOffset); } catch {}
        orig();
      })(io.disconnect.bind(io));
    }
    return () => io.disconnect();
  }, []);

  // Use shared PRIMARY_LINKS for landing by default to keep lists in sync
  const landingNavItems: NavItemData[] = PRIMARY_LINKS.map((l) => ({ href: l.href, label: l.label }));

  const appNavItems: NavItemData[] = [
    { href: APP_LINKS.DASHBOARD.PROJECTS.replace('/projects',''), label: "Dashboard" },
  ];

  const navItems = (items && items.length > 0)
    ? items
    : (mode === "app" ? appNavItems : (mode === "minimal" ? [] : (mode === "insights" ? landingNavItems : landingNavItems)));

  const layout = navbarLayout();
  const navbarStyles = navbarStyleVariants({ scrolled });

  return (
    <>
      <header
        className={cn(
          navbarStyles.navbar(),
          scrolled && navbarStyles.navbarScrolled(),
          'px-0',
          className
        )}
      >
        <div className={layout.container()}>
          {/* Left cluster: Logo + primary navigation */}
          <div className={layout.left()}>
            <Link
              href={APP_LINKS.NAV.HOME}
              aria-label="Corso home"
              className={cn(layout.logoLink(), navbarLogoVariants(), "mr-md")}
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
              <nav className={layout.desktopNav()} aria-label="Primary navigation">
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
            <div className={layout.right()}>
              <Ctas className={navbarStyles.button()} />
            </div>
          ) : (
            <div className={layout.right()}>
              {forceShowCTAs || mode === "landing" || mode === "insights" ? (
                <Ctas className={navbarStyles.button()} />
              ) : isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <Ctas className={navbarStyles.button()} />
              )}
            </div>
          )}

          {/* Mobile menu trigger and content */}
          <div className={layout.mobileTriggerContainer()}>
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
      <div ref={sentinelRef} className={layout.sentinel()} aria-hidden="true" />
    </>
  );
}


