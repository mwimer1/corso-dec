'use client';
import { cn } from '@/styles';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

type Props = {
  children: ReactNode;
  /** CSS selector for your sticky nav element */
  navSelector?: string;
  className?: string;
};

export function SiteFooterShell({ children, navSelector = '[data-sticky-nav]', className }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nav =
      (navSelector && document.querySelector<HTMLElement>(navSelector)) ||
      document.querySelector<HTMLElement>('header[role="banner"], header');
    if (!nav || !ref.current) return;

    const apply = () => {
      if (!ref.current || !nav.isConnected) return;
      const h = Math.ceil(nav.getBoundingClientRect().height);
      ref.current.style.setProperty('--nav-h', `${h}px`);
    };

    apply();
    let ro: ResizeObserver;
    try {
      ro = new ResizeObserver(apply);
      ro.observe(nav);
    } catch {
      // ResizeObserver not supported, fall back to window resize only
      console.warn('ResizeObserver not supported, falling back to window resize listener');
    }

    window.addEventListener('resize', apply);
    return () => {
      try {
        ro?.disconnect();
      } catch {
        // ResizeObserver already disconnected or not supported
      }
      window.removeEventListener('resize', apply);
    };
  }, [navSelector]);

  return (
    <section
      ref={(node) => { ref.current = node; }}
      className={cn('min-h-[calc(100vh-var(--nav-h,0px))] flex flex-col', className)}
    >
      {children}
    </section>
  );
}



