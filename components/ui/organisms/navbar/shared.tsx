"use client";

import * as React from "react";

import { Button } from "@/components/ui/atoms";
import { LinkTrack } from "@/components/ui/molecules/link-track";
import { cn } from "@/styles";
import { navbarStyleVariants } from "@/styles/ui/organisms/navbar-variants";
import { CTA_LINKS, PRIMARY_LINKS } from './links';

// Helper to handle both function and string returns from tv() slots
// (defensive fix for test environment where slots may return strings directly)
function cls(x: unknown): string | undefined {
  return typeof x === 'function' ? (x as () => string)() : (x as string | undefined);
}

export const MenuPrimaryLinks: React.FC<{ className?: string }> = ({ className }) => (
  <>
    {PRIMARY_LINKS.map((item) => {
      const linkProps: any = {
        key: item.href,
        href: item.href,
        label: item.label,
        ...(item.prefetch !== undefined ? { prefetch: item.prefetch } : {}),
        className: cn(cls(navbarStyleVariants().navItem), className)
      };

      if (item.target) {
        linkProps.target = item.target;
        if (item.target === '_blank') {
          linkProps.rel = 'noopener noreferrer';
        }
      }

      const { key, ...restProps } = linkProps;
      return (
        <LinkTrack key={key} {...restProps}>
          {item.label}
        </LinkTrack>
      );
    })}
  </>
);

interface CtasProps {
  className?: string | undefined;
}

export const Ctas: React.FC<CtasProps> = ({ className }) => {
  return (
    <>
      {CTA_LINKS.map((item) => {
        const linkProps: any = {
          href: item.href,
          label: item.label,
          ...(item.prefetch !== undefined ? { prefetch: item.prefetch } : {})
        };

        if (item.target) {
          linkProps.target = item.target;
          if (item.target === '_blank') {
            linkProps.rel = 'noopener noreferrer';
          }
        }

        const variant =
          item.href === '/sign-in' ? 'secondary'
          : item.href === '/sign-up' ? 'default' // IMPORTANT: dark CTA, NOT 'cta'
          : undefined;

        return (
          <Button
            key={item.href}
            variant={variant}
            asChild
            {...(className ? { className } : {})}
          >
            <LinkTrack {...linkProps}>
              {item.label}
            </LinkTrack>
          </Button>
        );
      })}
    </>
  );
};



