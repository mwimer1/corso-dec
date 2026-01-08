// components/marketing/legal/legal-section.tsx
import { cn } from "@/styles";
import type { ReactNode } from "react";
import { LegalContentWrapper } from "./legal-content-wrapper";

interface LegalSectionProps {
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
  [key: string]: any;
}

/**
 * LegalSection – shared prose wrapper preserving ids/anchors and spacing.
 * - Uses <article> by default via LegalContentWrapper, or a provided tag.
 * - Does not alter heading structure; callers pass their own content.
 */
export function LegalSection({ as, className, children, ...rest }: LegalSectionProps) {
  if (!as) {
    return (
      <LegalContentWrapper className={className} {...rest}>
        {children}
      </LegalContentWrapper>
    );
  }

  const Tag = as as keyof React.JSX.IntrinsicElements;
  return (
    <Tag>
      <LegalContentWrapper className={cn(className)} {...rest}>
        {children}
      </LegalContentWrapper>
    </Tag>
  );
}


