// components/ui/atoms/skip-nav-link.tsx

import {
    skipNavLinkVariants,
    type SkipNavLinkVariantProps,
} from "@/styles/ui/atoms";
import React from "react";

interface SkipNavLinkProps extends SkipNavLinkVariantProps {
  /** Target element ID to skip to */
  targetId?: string;
  /** Custom skip text */
  children?: React.ReactNode;
  className?: string;
}

/**
 * SkipNavLink – Renders a "Skip to main content" accessible link.
 * This should be placed at the top of the body for screen reader and keyboard users.
 */
export function SkipNavLink({
  position = "top-left",
  theme = "primary",
  size = "md",
  targetId = "main-content",
  children = "Skip to main content",
  className,
}: SkipNavLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={skipNavLinkVariants({ position, theme, size, className })}
    >
      {children}
    </a>
  );
}
