"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/styles";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs - Navigation breadcrumb trail for article pages.
 * Provides clear navigation path and improves UX for users landing from external sources.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps): JSX.Element {
  if (!items || items.length === 0) {
    return <></>;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground mb-6", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
            )}
            {isLast ? (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

