"use client";

import { Button } from "@/components/ui/atoms";
import { LinkTrack } from "@/components/ui/molecules/link-track";
import { APP_LINKS } from '@/components';
import { cn } from "@/styles";
import { footerCTA } from "@/styles/ui/organisms";
import { navbarStyleVariants } from "@/styles/ui/organisms/navbar-variants";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Tone = 'dark' | 'blue';
type Layout = 'center' | 'split';

type FooterCTAProps = ComponentPropsWithoutRef<"section"> & {
  tone?: Tone;
  layout?: Layout;
  fullBleed?: boolean;
  illustrationSlot?: ReactNode;
  /** Optional slot to fully override the default CTA buttons */
  ctaSlot?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
};

export const FooterCTA: React.FC<FooterCTAProps> = (props) => {
  const {
    className,
    illustrationSlot,
    ctaSlot,
    tone = 'blue',
    layout = 'center',
    fullBleed = true,
    title = 'Ready to start unlocking hidden insights?',
    description = 'Discover why leading builders, suppliers, and investors rely on Corso for permit-driven intelligence.',
    ...rest
  } = props;

  const isBlue = tone === 'blue';
  const isCenter = layout === 'center';

  const variants = footerCTA({
    tone,
    layout,
    fullBleed
  });

  const sectionBase = cn(
    variants.section(),
    className
  );

  const inner = cn(
    containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }),
    // Formatting-only change: reduce top/bottom padding and keep content vertically centered
    isBlue
      ? "py-[2.625rem] sm:py-[3.625rem] lg:py-[4.625rem] text-center"
      : ""
  );

  return (
    <section
      {...rest}
      className={cn(sectionBase, isBlue ? 'flex-1 flex flex-col justify-center' : '')}
      role="region"
      aria-labelledby="footer-cta-title"
    >
      {isBlue ? (
        <div className={cn(variants.blueGlow())} aria-hidden />
      ) : (
        <div className={cn(variants.glow())} aria-hidden />
      )}

      <div className={cn("relative z-10 mx-auto max-w-6xl", inner)}>
        <h2
          id="footer-cta-title"
          className={cn(
            "text-balance font-bold tracking-tight",
            // Slightly larger on wide screens
            isBlue ? "text-white text-4xl sm:text-5xl lg:text-6xl leading-tight" : "text-background text-3xl sm:text-4xl"
          )}
        >
          {title}
        </h2>

        {description ? (
          <p
            className={cn(
              containerMaxWidthVariants({ maxWidth: '2xl', centered: true }),
              "mt-md",
              // Slightly larger description on wide screens
              isBlue ? "mx-auto max-w-2xl text-lg lg:text-xl text-white/85" : "text-lg text-background/80"
            )}
          >
            {description}
          </p>
        ) : null}

        <div className={cn(variants.buttons())}>
          {ctaSlot ?? (
            <div className="z-10 mx-auto mt-lg flex w-full max-w-sm flex-col gap-lg sm:flex-row sm:items-center sm:justify-center">
              <Button
                asChild
                variant="whiteSolid"
                className={cn(
                  // Use the same base sizing/text tokens as navbar CTAs for parity
                  navbarStyleVariants().button(),
                  "w-full sm:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                )}
              >
                <LinkTrack
                  href={APP_LINKS.NAV.SIGNUP}
                  label="footer:start-for-free"
                  target="_blank"
                >
                  Start for free
                </LinkTrack>
              </Button>
              <Button
                asChild
                variant="whiteSolid"
                className={cn(
                  navbarStyleVariants().button(),
                  "w-full sm:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  // Keep the previous non-blue visual tweaks for contrast when tone isn't blue
                  isBlue ? variants.outlineButton() : "border-white/40 text-background hover:border-white/70 hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <LinkTrack
                  href={APP_LINKS.NAV.BOOK_DEMO}
                  label="footer:talk-to-sales"
                  target="_blank"
                >
                  Talk to sales
                </LinkTrack>
              </Button>
            </div>
          )}
        </div>

        {isCenter && illustrationSlot ? (
          <div className="mt-2xl flex justify-center" aria-hidden>
            {illustrationSlot}
          </div>
        ) : null}
      </div>
    </section>
  );
};
