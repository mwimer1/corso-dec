import { LinkTrack } from "@/components/ui/molecules/link-track";
import { BrandAssets } from "@/lib/shared";
import { APP_LINKS  } from '@/components';
import { cn } from "@/styles";
import { containerWithPaddingVariants } from "@/styles/ui/shared/container-helpers";
import Image from "next/image";
// import Link from "next/link";
import React from "react";

type LinkItem = { label: string; href: string; external?: boolean };

const groups: { heading: string; links: LinkItem[] }[] = [
  {
    heading: "Company",
    links: [
      { label: "Sign up", href: APP_LINKS.NAV.JOIN_WAITLIST, external: true },
      { label: "Pricing", href: APP_LINKS.NAV.PRICING },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Insights", href: APP_LINKS.NAV.INSIGHTS },
      { label: "FAQ", href: APP_LINKS.NAV.FAQ },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "Talk to sales", href: APP_LINKS.NAV.BOOK_DEMO, external: true },
      { label: "sales@getcorso.com", href: "mailto:sales@getcorso.com", external: true },
    ],
  },
];

const SocialLinkedIn = ({ className }: { className?: string }) => (
  <a
    href="https://www.linkedin.com/company/getcorso/"
    aria-label="Corso on LinkedIn"
    rel="noopener noreferrer"
    target="_blank"
    className={cn(
      "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      className
    )}
  >
    <svg
      width="28"
      height="28"
      viewBox="0 0 50 50"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M17,20v19h-6V20H17z M11,14.47
      c0-1.4,1.2-2.47,3-2.47s2.93,1.07,3,2.47c0,1.4-1.12,2.53-3,2.53C12.2,17,11,15.87,11,14.47z M39,39h-6c0,0,0-9.26,0-10
      c0-2-1-4-3.5-4.04h-0.08C27,24.96,26,27.02,26,29c0,0.91,0,10,0,10h-6V20h6v2.56c0,0,1.93-2.56,5.81-2.56c3.97,0,7.19,2.73,7.19,8.26
      V39z"
        fill="currentColor"
      />
    </svg>
  </a>
);

/** Smart internal/external link */
const SmartLink = ({ item }: { item: LinkItem }) =>
  item.external ? (
    <a
      href={item.href}
      className="text-sm text-background/80 hover:text-background hover:underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
      target="_blank"
      rel="noopener noreferrer"
    >
      {item.label}
    </a>
  ) : (
    <LinkTrack
      href={item.href}
      label={`footer:${item.label.toLowerCase().replace(/\s+/g, '-')}`}
      className="text-sm text-background/80 hover:text-background hover:underline underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded"
    >
      {item.label}
    </LinkTrack>
  );

export const FooterMain: React.FC = () => {
  return (
    <footer className="w-full bg-[hsl(var(--footer-middle))] text-background" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className={cn(containerWithPaddingVariants({ maxWidth: "7xl", padding: "lg" }), "py-8 lg:py-10")}>
        {/* Top-align. Desktop: four equal tracks so each section gets the same width. */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4 lg:gap-14">
          {/* Brand / Social */}
          <div className="flex flex-col gap-2 self-start min-w-0">
            <a
              href="https://www.getcorso.com/"
              className="inline-flex items-center hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
              aria-label="Go to getcorso.com"
            >
              <Image
                src={BrandAssets.logo}
                alt="CORSO"
                width={160}
                height={45}
                className="h-[var(--navbar-logo-h,2rem)] w-[var(--navbar-logo-w,8rem)] object-contain filter brightness-0 invert"
                priority
              />
            </a>

            <p className="mt-1 text-sm text-background/75 max-w-sm">
              Intelligence for the built world.
            </p>

            <div className="mt-0">
              <SocialLinkedIn className="text-background/70" />
            </div>
          </div>

          {/* Link columns - 4 column layout on wide screens */}
          {groups.map((group, index) => (
            <nav
              key={group.heading}
              aria-label={group.heading}
              className={cn(
                "flex flex-col gap-4 self-start min-w-0",
                // Middle two: centered; last: right; all equal column widths via grid
                index === 0 || index === 1
                  ? "lg:items-center lg:text-center"
                  : index === groups.length - 1
                  ? "lg:items-end lg:text-right"
                  : "lg:items-start"
              )}
            >
              <span className="text-sm font-semibold text-background/80 mb-2">
                {group.heading}
              </span>
              <ul className="space-y-3">
                {group.links.map((item) => (
                  <li key={item.label}>
                    <SmartLink item={item} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
};
