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
    const legal = document.querySelector<HTMLElement>('[data-footer-legal]');
    
    if (!nav || !ref.current) return;

    const apply = () => {
      if (!ref.current || !nav.isConnected) return;
      const navH = Math.ceil(nav.getBoundingClientRect().height);
      const legalH = legal ? Math.ceil(legal.getBoundingClientRect().height) : 0;
      ref.current.style.setProperty('--nav-h', `${navH}px`);
      ref.current.style.setProperty('--legal-h', `${legalH}px`);
    };

    apply();
    let ro: ResizeObserver;
    try {
      ro = new ResizeObserver(apply);
      ro.observe(nav);
      if (legal) {
        ro.observe(legal);
      }
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
      className={cn('min-h-[calc(100vh-var(--nav-h,0px)-var(--legal-h,0px))] flex flex-col', className)}
    >
      {children}
    </section>
  );
}



