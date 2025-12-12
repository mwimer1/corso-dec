// components/ui/atoms/logo.tsx
"use client";

import { cn } from "@/styles";
import Image from "next/image";
import * as React from "react";

interface LogoProps {
  /** Whether to show only the icon (collapsed state) or full logo */
  collapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Width of the logo container */
  width?: number;
  /** Height of the logo container */
  height?: number;
}

/**
 * Logo component that displays the Corso logo.
 * When collapsed=true, shows only the icon portion.
 * When collapsed=false, shows the full logo with text.
 */
export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  function Logo({ collapsed = false, className, width, height }, ref) {
    if (collapsed) {
      // Show only the icon portion (left side of the logo)
      return (
        <div ref={ref} className={cn("flex items-center justify-center", className)}>
          <Image
            src="/logo.svg"
            alt="Corso"
            width={width || 32}
            height={height || 32}
            className="object-contain"
            style={{
              // Crop to show only the left portion (icon) of the logo
              objectPosition: "left center",
              clipPath: "inset(0 70% 0 0)", // Show only the left 30% of the logo
            }}
          />
        </div>
      );
    }

    // Show full logo with text
    return (
      <div ref={ref} className={cn("flex items-center", className)}>
        <Image
          src="/logo.svg"
          alt="Corso"
          width={width || 120}
          height={height || 32}
          className="object-contain"
        />
      </div>
    );
  },
);

Logo.displayName = "Logo";
