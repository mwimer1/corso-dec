"use client";

import { cn } from "@/styles";
import { ChevronDown, ChevronUp } from "lucide-react";
import usePrefersReducedMotion from "@/components/landing/hooks/use-prefers-reduced-motion";
import * as React from "react";

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  /** HTML content to extract headings from */
  content: string;
  /** Additional CSS classes */
  className?: string;
  /** Variant: 'mobile' renders mobile TOC, 'desktop' renders desktop TOC, 'both' renders both (default) */
  variant?: 'mobile' | 'desktop' | 'both';
}

/**
 * TableOfContents - Extracts H2 and H3 headings from article content and displays
 * them as a navigable table of contents. Desktop: sticky aside on the right.
 * Mobile: collapsible dropdown.
 */
export function TableOfContents({
  content,
  className,
  variant = 'both',
}: TableOfContentsProps): React.ReactElement | null {
  const [isOpen, setIsOpen] = React.useState(false);
  const [headings, setHeadings] = React.useState<TableOfContentsItem[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Extract headings from HTML content
  React.useEffect(() => {
    if (!content) {
      setHeadings([]);
      return;
    }

    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const headingElements = doc.querySelectorAll("h2, h3");

      const extracted: TableOfContentsItem[] = [];
      headingElements.forEach((heading) => {
        const id = heading.getAttribute("id");
        const text = heading.textContent?.trim() || "";
        const tagName = heading.tagName.toLowerCase();

        if (id && text && (tagName === "h2" || tagName === "h3")) {
          extracted.push({
            id,
            text,
            level: tagName === "h2" ? 2 : 3,
          });
        }
      });

      setHeadings(extracted);
    } catch {
      // If parsing fails, set empty headings
      setHeadings([]);
    }
  }, [content]);

  // Don't render if no headings found
  if (headings.length === 0) {
    return null;
  }

  const handleHeadingClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Account for sticky header offset (scroll-mt-20 = 5rem = 80px)
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      // Close mobile menu after navigation
      setIsOpen(false);

      // Update URL without triggering scroll
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const showMobile = variant === 'mobile' || variant === 'both';
  const showDesktop = variant === 'desktop' || variant === 'both';

  return (
    <>
      {/* Mobile: Collapsible dropdown */}
      {showMobile && (
      <div className={cn("lg:hidden mb-6", className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between",
            "px-4 py-3 rounded-lg border border-border bg-muted/50",
            "text-sm font-semibold text-foreground",
            "hover:bg-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-expanded={isOpen}
          aria-controls="toc-mobile-content"
        >
          <span>Table of Contents</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        {isOpen && (
          <nav
            id="toc-mobile-content"
            aria-label="On this page"
            className={cn(
              "mt-2 rounded-lg border border-border bg-muted/30 p-4",
              "max-h-[60vh] overflow-y-auto"
            )}
          >
            <ul className="space-y-2">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => handleHeadingClick(e, heading.id)}
                    className={cn(
                      "block py-1 text-sm transition-colors",
                      "hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
                      heading.level === 2
                        ? "font-semibold text-foreground"
                        : "font-normal text-muted-foreground pl-4"
                    )}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      )}

      {/* Desktop: Sticky aside */}
      {showDesktop && (
      <aside
        className={cn(
          "sticky top-24 self-start",
          "w-full",
          "max-h-[calc(100vh-8rem)] overflow-y-auto",
          className
        )}
      >
        <nav 
          className="rounded-lg border border-border bg-muted/30 p-4"
          aria-labelledby="toc-heading"
        >
          <h2 id="toc-heading" className="text-sm font-semibold text-foreground mb-3">On this page</h2>
          <ul className="space-y-2">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleHeadingClick(e, heading.id)}
                  className={cn(
                    "block py-1 text-sm transition-colors",
                    "hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
                    heading.level === 2
                      ? "font-semibold text-foreground"
                      : "font-normal text-muted-foreground pl-4"
                  )}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      )}
    </>
  );
}
