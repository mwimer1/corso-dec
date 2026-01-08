// components/marketing/legal/legal-content-wrapper.tsx
import type { HTMLAttributes } from "react";

interface LegalContentWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function LegalContentWrapper({
  className,
  children,
  ...props
}: LegalContentWrapperProps) {
  return (
    <article
      className={`mx-auto w-full max-w-4xl prose dark:prose-invert ${className || ''}`}
      {...props}
    >
      {children}
    </article>
  );
} 
