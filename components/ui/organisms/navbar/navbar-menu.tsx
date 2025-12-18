// components/ui/organisms/navbar/navbar-menu.tsx
"use client";

import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button, HamburgerIcon, XMarkIcon } from "@/components/ui/atoms";
import { NavItem } from "@/components/ui/molecules/nav-item";
import { cn } from "@/styles";
import { navbarStyleVariants } from "@/styles/ui/organisms/navbar-variants";
import type { NavItemData } from "@/types/shared";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Ctas, MenuPrimaryLinks } from './shared';

interface NavbarMenuProps {
  items: NavItemData[];
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSignedIn: boolean;
  variant: "app" | "landing";
  /**
   * Controls which sections render. Use "items" for left cluster, "auth" for right cluster,
   * "mobile" for mobile-only menu, or "all" (default) for combined rendering.
   */
  section?: "all" | "items" | "auth" | "mobile";
  /** Toggle visibility of specific auth actions (desktop and mobile). */
  showLogin?: boolean;
  showSignup?: boolean;
}

export function NavbarMenu({
  items,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSignedIn,
  variant: _variant,
  section = "all",
  // Flags currently unused; reserved for future variant controls
  showLogin: _showLogin = true,
  showSignup: _showSignup = true,
}: NavbarMenuProps) {
  const navbarStyles = navbarStyleVariants();
  const pathname = usePathname();

  // Unified render helpers to avoid duplication between desktop and mobile
  // Never show UserButton on landing pages - authenticated users should be redirected by middleware
  const renderAuthSection = React.useCallback(
    (opts?: { onItemClick?: () => void; layout?: "desktop" | "mobile" }) => (
      <div
        className={cn(
          opts?.layout === "mobile"
            ? "mt-md w-full flex items-center gap-2.5 justify-stretch"
            : "flex items-center gap-sm",
        )}
      >
        {/* Landing variant: always show CTAs (authenticated users should be redirected by middleware) */}
        {/* App variant: show UserButton if signed in, CTAs if not */}
        {_variant === "landing" ? (
          <div className={opts?.layout === "mobile" ? "w-full flex items-center gap-2.5" : undefined}>
            <Ctas className={opts?.layout === "mobile" ? "flex-1" : undefined} />
          </div>
        ) : isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <div className={opts?.layout === "mobile" ? "w-full flex items-center gap-2.5" : undefined}>
            <Ctas className={opts?.layout === "mobile" ? "flex-1" : undefined} />
          </div>
        )}
      </div>
    ),
    [isSignedIn, _variant],
  );

  // Determine if a nav item is active based on current pathname
  const isItemActive = React.useCallback((item: NavItemData): boolean => {
    const itemHref = item.href;
    // Remove hash from href for comparison
    const itemPath = itemHref.split('#')[0];
    
    // For Pricing link, match if we're on /pricing (with or without hash)
    if (itemPath === '/pricing') {
      return pathname === '/pricing';
    }
    
    // For other links, match exact pathname or if pathname starts with the href
    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  }, [pathname]);

  const renderItem = React.useCallback(
    (item: NavItemData, onClick?: () => void, size?: 'navLink' | 'mobileItem') => {
      const active = isItemActive(item);
      return (
        <NavItem
          key={String(item.href)}
          href={item.href}
          external={item.external === true}
          isActive={active}
          {...(onClick && { onClick })}
          {...(size && { size })}
          {...(size === 'mobileItem' ? { className: navbarStyles.mobileNavItem() } : undefined)}
          {...(item.label === 'FAQ' ? { className: 'hide-faq-901' } : undefined)}
          variant="text"
        >
          {item.label}
        </NavItem>
      );
    },
    [navbarStyles, isItemActive],
  );

  return (
    <>
      {/* Desktop Menu */}
      {(section === "all" || section === "items") && (
        <nav className="hidden items-center gap-md md:flex">
          <MenuPrimaryLinks className="mr-md" />
        </nav>
      )}

      {/* Desktop Auth */}
      {(section === "all" || section === "auth") && (
        <div className="hidden md:flex">{renderAuthSection({ layout: "desktop" })}</div>
      )}

      {/* Mobile Menu (only render once via section=all or section=mobile) */}
      {(section === "all" || section === "mobile") && (
        <DialogPrimitive.Root open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <div className="md:hidden">
            <DialogPrimitive.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-haspopup="dialog"
                className="rounded-md border border-border h-9 w-9 grid place-items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <HamburgerIcon className="h-6 w-6" />
                )}
              </Button>
            </DialogPrimitive.Trigger>
          </div>

          <DialogPrimitive.Content
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            aria-describedby="mobile-menu-description"
            className={cn(
              navbarStyles.mobileMenu(),
              isMobileMenuOpen && navbarStyles.mobileMenuOpen()
            )}
          >
            <DialogPrimitive.Title id="mobile-menu-title" className="sr-only">
              Mobile Navigation
            </DialogPrimitive.Title>
            <DialogPrimitive.Description id="mobile-menu-description" className="sr-only">
              Mobile navigation menu
            </DialogPrimitive.Description>
            <nav aria-label="Mobile navigation" className={navbarStyles.mobileNav()}>
              {items.map((i) => renderItem(i, () => setIsMobileMenuOpen(false), 'mobileItem'))}
              {renderAuthSection({ onItemClick: () => setIsMobileMenuOpen(false), layout: "mobile" })}
            </nav>
          </DialogPrimitive.Content>
        </DialogPrimitive.Root>
      )}
    </>
  );
}


