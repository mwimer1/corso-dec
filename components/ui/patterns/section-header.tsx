import { cn } from "@/styles";
import { headingVariants } from "@/styles/ui/shared/typography-variants";
import * as React from "react";
type SectionHeaderProps = {
  title: React.ReactNode;
  /** @deprecated Use subtitle instead for consistency */
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center" | "right";
  /** Keeps correct document outline; default 2 to avoid stealing the page H1 */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Optional visual variant if you need larger spacing/size (e.g., marketing hero) */
  size?: "default" | "marketingHero";
  /** Precise overrides when a section has unique spacing/size needs */
  titleClassName?: string;
  descriptionClassName?: string;
  className?: string;
  /** ID for the heading element (for aria-labelledby) */
  id?: string;
};

/**
 * SectionHeader – semantic, reusable title/subtitle block used across domains.
 * Remains SSR-safe (no hooks) so it can be used in server and client code.
 */
export const SectionHeader = React.forwardRef<HTMLElement, SectionHeaderProps>(
  (
    {
      title,
      description,
      subtitle,
      align = "left",
      headingLevel = 2,
      size = "default",
      titleClassName,
      descriptionClassName,
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const Tag = (`h${headingLevel}` as unknown) as keyof JSX.IntrinsicElements;

    const titleSizeClass: "hero" | "h1" = size === "marketingHero" ? "h1" : "h1"; // visual parity via headingVariants

    // Support both description and subtitle props, prefer subtitle for consistency
    const content = subtitle || description;

    return (
      <header
        ref={ref}
        className={cn(align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left", "space-y-sm", className)}
        {...rest}
      >
        <Tag 
          {...(id && { id })}
          className={cn(headingVariants({ size: titleSizeClass }), "text-foreground", titleClassName)}
        >
          {title}
        </Tag>
        {content ? (
          <p className={cn(size === "marketingHero" ? "mt-lg text-lg text-muted-foreground max-w-2xl mx-auto" : "mt-4 text-lg text-muted-foreground max-w-2xl mx-auto", descriptionClassName)}>
            {content}
          </p>
        ) : null}
      </header>
    );
  },
);

SectionHeader.displayName = "SectionHeader";

