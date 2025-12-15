// components/ui/organisms/footer.tsx
import { LinkTrack } from "@/components/ui/molecules";
import { APP_LINKS } from '@/components';
import { cn } from "@/styles";
import { footer as footerVariants } from "@/styles/ui/organisms/footer-variants";
import { focusRing } from "@/styles/ui/shared/focus-ring";
import * as React from "react";

interface FooterLink {
  href: string;
  label: string;
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  /** Footer variant - affects styling and behavior */
  variant?: "landing" | "app";
  /** Custom links to display (overrides default links for variant) */
  links?: FooterLink[];
  /** Custom copyright text (overrides default) */
  copyright?: string;
  /** Whether to show "All rights reserved" text */
  showRightsReserved?: boolean;
}

/**
 * Footer – Unified footer component with configurable variants.
 *
 * Variants:
 * - "landing": Light background, 4 links (Privacy, Terms, Security, Status)
 * - "app": Dark background, 2 links (Terms & Conditions, Privacy Policy)
 */
export function Footer({
  variant = "landing",
  links,
  copyright,
  showRightsReserved,
  className,
  ...props
}: FooterProps) {
  // Default links based on variant
  const defaultLinks: Record<"landing" | "app", FooterLink[]> = {
    landing: [
      { href: APP_LINKS.FOOTER.PRIVACY, label: "Privacy" },
      { href: APP_LINKS.FOOTER.TERMS, label: "Terms" },
      { href: APP_LINKS.FOOTER.SECURITY ?? "/security", label: "Security" },
      { href: APP_LINKS.FOOTER.STATUS ?? "/status", label: "Status" },
    ],
    app: [
      { href: APP_LINKS.FOOTER.TERMS, label: "Terms & Conditions" },
      { href: APP_LINKS.FOOTER.PRIVACY, label: "Privacy Policy" },
    ],
  };

  // Default copyright text
  const defaultCopyright = `© ${new Date().getFullYear()} Corso Inc.`;
  const copyrightText = copyright ?? defaultCopyright;
  const rightsText = showRightsReserved ?? (variant === "app") ? " All rights reserved." : "";

  const isApp = variant === "app";
  const containerClass = footerVariants({ mode: isApp ? 'app' : 'landing', padding: isApp ? 'lg' : 'xl' });
  const finalLinks = links ?? defaultLinks[variant];

  return (
    <footer className={cn(containerClass, "text-sm", className)} {...props}>
      <div className={cn(
        "mx-auto flex flex-col items-center gap-lg md:flex-row md:justify-between",
        variant === "app" && "container space-y-md px-md sm:space-y-0 sm:px-lg lg:px-xl"
      )}>
        {/* Copyright */}
        <span className={cn(
          "font-semibold",
          isApp && "whitespace-nowrap text-center sm:text-left font-medium"
        )}>
          {copyrightText}{rightsText}
        </span>

        {/* Navigation */}
        <nav
          className={cn(
            "flex flex-wrap items-center justify-center gap-lg",
            isApp && "flex gap-lg"
          )}
          aria-label="Footer navigation"
        >
          {finalLinks.map((link) => (
            <FooterLink
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors duration-200 hover:underline",
                isApp && cn(
                  "whitespace-nowrap rounded",
                  "hover:text-background/70 active:text-background/80",
                  focusRing('primary'),
                ),
              )}
            >
              {link.label}
            </FooterLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string | undefined;
  useLegacy?: boolean;
}

function FooterLink({ href, children, className }: FooterLinkProps) {
  return (
    <LinkTrack
      href={href}
      label={`footer:${typeof href === 'string' ? href : 'link'}`}
      {...(className ? { className } : undefined)}
    >
      {children}
    </LinkTrack>
  );
}
