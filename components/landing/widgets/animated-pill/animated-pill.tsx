'use client';

import { LinkTrack } from '@/components/ui/molecules';
import { APP_LINKS  } from '@/components';
import { cn } from '@/styles';
import type { ComponentPropsWithoutRef } from 'react';
import { useCallback, useEffect, useRef } from 'react';

export type AnimatedPillProps = {
  text?: string;
  href?: string;
  label?: string;
  spinMs?: number;
  sheen?: boolean;
  sheenMs?: number;
  /**
   * Extra pixels to add beyond the measured H1 first-line width.
   * Helps avoid rare kerning/word-wrap clipping on certain DPIs/fonts.
   * Defaults to 2px. Set to 0 to disable.
   */
  overscanPx?: number;
} & Pick<ComponentPropsWithoutRef<'span'>, 'className'>;

const AnimatedPill: React.FC<AnimatedPillProps> = ({
  text = 'Construction data made easy',
  href = APP_LINKS.NAV.PRICING,
  label = 'hero:pill',
  className,
  spinMs: _spinMs,
  sheen: _she,
  sheenMs: _sheMs,
  overscanPx: _overscanPx = 2
}) => {
  // Animated border ring with continuous spinning animation (no pointer tracking)
  const borderFxRef = useRef<HTMLSpanElement | null>(null);
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const animRef = useRef<{
    angle: number;
    spinRaf: number | null;
  }>({ angle: -80, spinRaf: null });

  const spinStep = useCallback(() => {
    const state = animRef.current;
    const ring = borderFxRef.current;
    if (!ring) return;

    // Increment angle for continuous spinning
    state.angle += 2; // degrees per frame for smooth rotation

    ring.style.setProperty('--spin-angle', `${state.angle}deg`);

    // Continue spinning
    state.spinRaf = requestAnimationFrame(spinStep);
  }, []);

  const startSpinning = useCallback(() => {
    if (animRef.current.spinRaf == null) {
      animRef.current.spinRaf = requestAnimationFrame(spinStep);
    }
  }, [spinStep]);

  // Measure the H1 first-line width and expose it via a CSS variable so the pill
  // can match the first row (the word "Intelligence"). We measure on mount and
  // on resize to stay in sync with responsive typography.
  useEffect(() => {
    let ro: ResizeObserver | null = null;
    const measure = () => {
      try {
        const host = hostRef.current;
        if (!host) return;
        // Find the nearest hero section and its H1
        const hero = host.closest('section');
        const h1 = hero?.querySelector('h1');
        if (!h1) return;

        // The H1 in this layout uses an explicit <br/> after the first word,
        // so the first text node contains the first row. Find that node.
        let firstTextNode: ChildNode | null = null;
        for (const n of Array.from(h1.childNodes)) {
          if (n.nodeType === Node.TEXT_NODE && n.textContent && n.textContent.trim().length > 0) {
            firstTextNode = n;
            break;
          }
        }
        // Fallback: measure entire h1 if we can't find the first text node
        const range = document.createRange();
        if (firstTextNode) {
          range.selectNodeContents(firstTextNode);
        } else {
          range.selectNodeContents(h1);
        }
        const r = range.getBoundingClientRect();
        const width = Math.round(r.width || h1.getBoundingClientRect().width || 0);
        host.style.setProperty('--pill-target-width', `${width}px`);
      } catch {
        // silent - measurement is best-effort
      }
    };

    measure();
    window.addEventListener('resize', measure);
    // Observe hero for layout changes
    const heroEl = hostRef.current?.closest('section');
    if (heroEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(heroEl as Element);
    }

    return () => {
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, []);

  // NOTE: spinMs/sheen/sheemMs are kept for API compatibility but are no-ops in this variant.
  // The new effect uses a conic-gradient border, matching the provided example.
  // NOTE: The host <span> consumes two CSS vars:
  //  - --pill-target-width: set by the existing measurement routine.
  //  - --pill-overscan:     tiny additive cushion to counter sub-pixel kerning.

  // Start continuous spinning animation
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq?.matches) return;

    const initialState = animRef.current;
    startSpinning();

    return () => {
      if (initialState.spinRaf != null) {
        cancelAnimationFrame(initialState.spinRaf);
        initialState.spinRaf = null;
      }
    };
  }, [startSpinning]);

  return (
    <span
      className={cn('animated-pill width-clamp inline-flex items-center justify-center', 'whitespace-nowrap', className)}
      // SSR/CSR safety: provide a conservative default so initial paint is stable.
      style={{
        ['--pill-target-width' as any]: 'var(--measure-ch, 0ch)',
        ['--pill-overscan' as any]: `${Math.max(0, _overscanPx || 2)}px`
      }}
    >
      {/* inner host for ring rendering */}
      <span
        ref={hostRef}
        className={cn(
          // Outer clickable region; **no grey border** (we render a gradient ring instead).
          'relative block',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
        )}
      >
        {/* RING LAYER (NEW) — sits *outside* the content box via negative inset, so it's visible */}
        <span
          ref={borderFxRef}
          aria-hidden="true"
          className="absolute pointer-events-none will-change-[background]"
          style={{
            // Initial placement & orientation (updated by RAF)
            ['--spin-angle' as any]: '-80deg',
            // Make the ring extend just outside the content with better edge handling
            inset: 'calc(var(--pill-overscan, 2px) * -1)',
            borderRadius: '16px', // Increased for smoother edges
            // Draw conic gradient that spins continuously from center (50% thinner border)
            background: `
              conic-gradient(
                from var(--spin-angle)
                at 50% 50%,
                #A3ECE900 0deg,
                #A3ECE9 7.5deg,
                #709FF5 37.5deg,
                #709FF5 60deg,
                #0000 52.5deg,
                #0000 360deg
              )
            `,
          }}
        />

        {/*
          OPTIONAL "inside" ring variant (use if a parent clips negative inset):
          <span
            aria-hidden="true"
            className="absolute pointer-events-none will-change-[background]"
            style={{
              inset: 0,
              borderRadius: '13px',
              padding: '1.5px',
              background: 'conic-gradient(from var(--angle) at var(--x) var(--y), #A3ECE900, #A3ECE9 20deg, #709FF5 100deg, #709FF5 120deg, #0000 83deg)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              zIndex: 1, // above content
            } as React.CSSProperties}
          />
        */}

        <LinkTrack
          href={href}
          label={label}
          className={cn(
            // Inner content chip
            'relative z-[1] flex items-center gap-x-1',
            // Inner content: use semantic sizing tokens for consistency
            // Increase size slightly to remain readable while keeping visual rhythm
            'font-semibold text-lg leading-[22px] text-secondary-foreground',
            // Padding tuned so pill width approximates H1 first-line width
            'py-[8px] pr-[12px] pl-[16px]',
            // Background hover transition
            'bg-white hover:bg-[#FBFBFC] transition-colors duration-300 ease-in-out',
            // Increased border-radius for smoother edges
            'rounded-[16px]'
          )}
        >
          <span>{text}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M5.5 4l3 3-3 3"
              stroke="currentColor"
              strokeWidth={1.1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </LinkTrack>
      </span>
    </span>
  );
};

export default AnimatedPill;

