// components/ui/molecules/nav-item.tsx
"use client";

import { Link } from "@/components/ui/atoms/link";
import { trackNavClick } from "@/components/ui/shared/analytics";
import { cn } from "@/styles";
import { navItemVariants, type NavItemVariantProps } from "@/styles/ui/molecules";
import type { LinkProps as NextLinkProps } from "next/link";
import * as React from "react";

/**
 * Base NavItem Props shared between internal and external links
 */
interface BaseNavItemProps extends NavItemVariantProps {
  /**
   * Additional CSS classes to apply
   */
  className?: string;

  /**
   * Content of the navigation item
   */
  children: React.ReactNode;

  /**
   * Whether the navigation item is currently active
   * @default false
   */
  isActive?: boolean;

  /**
   * Whether the navigation item is disabled
   * @default false
   */
  isDisabled?: boolean;
}

/**
 * Internal NavItem Props - for internal routes using Next.js routing
 */
interface InternalNavItemProps
  extends BaseNavItemProps,
    Omit<
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
      "href" | "target" | "rel" | "className" | "children"
    > {
  href: NextLinkProps["href"];
  external?: false;
}

/**
 * External NavItem Props - for external URLs
 */
interface ExternalNavItemProps
  extends BaseNavItemProps,
    Omit<
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
      "className" | "children"
    > {
  href: string;
  external: true;
}

/**
 * NavItem Props - discriminated union for internal and external links
 */
type NavItemProps = InternalNavItemProps | ExternalNavItemProps;

/**
 * NavItem – Navigation link component with variant support and proper accessibility.
 *
 * Features:
 * - Supports internal and external links via custom Link component
 * - Configurable variants (text, button, icon)
 * - State management (active, disabled)
 * - Full accessibility support
 * - TypeScript safe with exactOptionalPropertyTypes
 *
 * @example
 * ```tsx
 * <NavItem href="/dashboard" variant="button" state="active">
 *   Dashboard
 * </NavItem>
 *
 * <NavItem href="https://example.com" external variant="text">
 *   External Link
 * </NavItem>
 * ```
 */
export const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  (
    {
      href,
      children,
      className,
      variant = "text",
      size,
      state,
      isActive = false,
      isDisabled = false,
      external,
      onClick,
      ...props
    },
    ref,
  ) => {
    // Determine the appropriate state based on props
    const computedState = React.useMemo(() => {
      if (isDisabled) return "disabled";
      if (isActive) return "active";
      return state || "default";
    }, [isDisabled, isActive, state]);

    // Handle disabled state and analytics tracking
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (isDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        // Track navigation click
        const label = typeof children === 'string' ? children : String(href);
        trackNavClick(label, String(href));

        // Call original onClick if provided
        if (onClick) {
          onClick(event);
        }
      },
      [isDisabled, onClick, children, href],
    );

    const navItemClasses = cn(
      navItemVariants({
        variant,
        state: computedState,
        ...(size ? { size } : undefined),
      }),
      className,
    );

    // Prepare link props based on external flag
    const linkProps = external
      ? { href, external: true as const, ...props }
      : { href, external: false as const, ...props };

    return (
      <Link
        ref={ref}
        {...linkProps}
        onClick={handleClick}
        aria-disabled={isDisabled}
        aria-current={isActive ? "page" : undefined}
        tabIndex={isDisabled ? -1 : undefined}
        className={cn(
          navItemClasses,
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
      >
        {variant === "icon" ? children : <span>{children}</span>}
      </Link>
    );
  },
);

NavItem.displayName = "NavItem";


