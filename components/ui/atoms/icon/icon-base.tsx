// components/ui/atoms/icon/icon-base.tsx
import { cn } from "@/styles";
import { iconVariants, type IconVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/**
 * IconBase – a shared base for SVG icons that applies size and color tokens.
 * By default renders a 24x24 SVG. Accepts `size` (token size) and `intent` (default, primary, etc.).
 * If `pixelSize` is provided, it overrides the token size with an explicit width/height.
 */
const IconBase = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement> & IconVariantProps & {
  pixelSize?: number | string;
  strokeWidth?: number;
}>(function IconBase(
  { className, pixelSize = 24, size = "md", intent = "default", strokeWidth = 1.5, ...rest },
  ref,
) {
  // Extract a few a11y-related props if provided
  const { role, title, ["aria-label"]: ariaLabel } = rest as unknown as {
    role?: string;
    title?: string;
    "aria-label"?: string;
  };

  // Default decorative behavior: hide from a11y unless an accessible name/role is provided
  const ariaHidden = ariaLabel || role === "img" || title ? undefined : true;

  return (
    <svg
      ref={ref}
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(iconVariants({ size, intent }), className)}
      aria-hidden={ariaHidden}
      focusable={false}
      strokeWidth={strokeWidth}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {rest.children as React.ReactNode}
    </svg>
  );
});
IconBase.displayName = "IconBase";

/**
 * Icon factory that creates icon components with consistent boilerplate.
 * Each icon only needs to provide its unique SVG path content.
 *
 * @param displayName - The display name for the component (used for debugging)
 * @param pathContent - The SVG path content (ReactNode)
 * @returns A React component with consistent props and behavior
 *
 * @example
 * ```tsx
 * export const StarIcon = createIcon("StarIcon", (
 *   <path
 *     d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
 *     stroke="currentColor"
 *     strokeWidth="2"
 *     strokeLinecap="round"
 *     strokeLinejoin="round"
 *   />
 * ));
 * ```
 */
export function createIcon(
  displayName: string,
  pathContent: React.ReactNode,
) {
  const IconComponent = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement> & IconVariantProps & {
    pixelSize?: number | string;
    strokeWidth?: number;
  }>(function Icon(
    { className, pixelSize = 24, size = "md", intent = "default", strokeWidth = 1.5, ...rest },
    ref,
  ) {
    return (
      <IconBase
        ref={ref}
        pixelSize={pixelSize}
        size={size}
        intent={intent}
        strokeWidth={strokeWidth}
        className={className}
        {...rest}
      >
        {pathContent}
      </IconBase>
    );
  });

  IconComponent.displayName = displayName;
  return IconComponent;
}

/**
 * Common stroke attributes used across multiple icons
 * This eliminates duplication of stroke="currentColor" strokeWidth="2" etc.
 */
export const COMMON_ICON_STROKE_ATTRS = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
} as const;




