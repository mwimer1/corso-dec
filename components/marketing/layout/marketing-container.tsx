import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared";
import type { VariantProps } from "@/styles";
import * as React from "react";

interface MarketingContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Optional max width alias (defaults to 7xl) */
  maxWidth?: VariantProps<typeof containerMaxWidthVariants>["maxWidth"];
  /** Whether to center within the container (defaults to true) */
  centered?: boolean;
}

export const MarketingContainer = React.forwardRef<
  HTMLDivElement,
  MarketingContainerProps
>(({ children, className, maxWidth = '7xl', centered = true }, ref) => (
  <section
    ref={ref}
    className={cn(
      containerMaxWidthVariants({ maxWidth, centered }),
      "px-4 sm:px-6 lg:px-8",
      className,
    )}
  >
    {children}
  </section>
));
MarketingContainer.displayName = "MarketingContainer";


