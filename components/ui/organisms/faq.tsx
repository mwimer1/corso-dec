'use client';
// components/ui/organisms/faq.tsx\n'use client';

import { cn } from "@/styles";
import { emptyStateVariants } from "@/styles/ui/molecules";
import { faqVariants } from "@/styles/ui/organisms";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import { focusRing } from "@/styles/ui/shared/focus-ring";
import { ChevronDown } from "lucide-react";
import * as React from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps extends React.HTMLAttributes<HTMLDivElement> {
  /** FAQ items to display */
  faqs: readonly FAQItem[];
  /** Title for the FAQ section */
  title?: string;
  /** Visual variant */
  variant?: "default" | "compact" | "spacious";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Spacing variant */
  spacing?: "tight" | "normal" | "loose";
}

/**
 * FAQ component with collapsible items
 * Supports multiple variants and customizable styling
 */
export const FAQ = React.forwardRef<HTMLDivElement, FAQProps>(
  (
    {
      faqs,
      title = "Frequently asked questions",
      variant = "default",
      size = "md",
      spacing = "normal",
      className,
      ...props
    },
    ref,
  ) => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    if (!faqs || faqs.length === 0) {
      return (
        <div ref={ref} className={cn(containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }), className)} {...props}>
          <section className={emptyStateVariants({ size: "md", context: "default", variant: "default" })}>
            <div className="flex items-center justify-center text-4xl mb-4 text-muted-foreground">❓</div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">No FAQs yet</h3>
              <p className="max-w-md text-muted-foreground/80">Check back soon for more information.</p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }),
          faqVariants({ variant, size, spacing }),
          className,
        )}
        {...props}
      >
        {title && (
          <h2 className="text-3xl font-bold tracking-tight text-foreground text-center">
            {title}
          </h2>
        )}

        <ul className={cn("space-y-lg", title ? "mt-2xl" : "")}>
          {faqs.map((f, i) => {
            const expanded = openIndex === i;
            const answerId = `faq-answer-${f.question.slice(0, 10).replace(/\s+/g, '-').toLowerCase()}`;
            const questionId = `faq-question-${f.question.slice(0, 10).replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <li
                key={f.question}
                className="rounded-lg border border-border bg-surface p-lg transition-colors hover:bg-muted/50"
              >
                <button
                  type="button"
                  id={questionId}
                  onClick={() => {
                    setOpenIndex(expanded ? null : i);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between text-left rounded-md",
                    focusRing()
                  )}
                  aria-expanded={expanded}
                  aria-controls={answerId}
                  aria-describedby={expanded ? answerId : undefined}
                >
                  <span className="text-lg font-semibold text-foreground">
                    {f.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-ml w-ml text-muted-foreground transition-transform",
                      expanded && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200",
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <p className="overflow-hidden text-sm text-muted-foreground">
                    {f.answer}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
FAQ.displayName = "FAQ";
