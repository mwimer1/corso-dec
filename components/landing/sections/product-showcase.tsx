// components/landing/sections/product-showcase.tsx
"use client";

import { TabSwitcher, type TabItem } from "@/components/ui/molecules";
import { trackEvent } from "@/lib/shared/analytics/track";
import { cn } from "@/styles";
import { containerWithPaddingVariants } from "@/styles/ui/shared/container-helpers";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import usePrefersReducedMotion from "../hooks/use-prefers-reduced-motion";

interface ProductShowcaseProps extends React.HTMLAttributes<HTMLDivElement> {}

/** ProductShowcase – Interactive dashboard view switcher using global TabSwitcher. */
export function ProductShowcase({ className, ...props }: ProductShowcaseProps) {
  const [activeTab, setActiveTab] = React.useState(0);
  const [isUserInteraction, setIsUserInteraction] = React.useState(false);
  const previousTabRef = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const intervalRef = useRef<number | undefined>(undefined);
  const isIntersectingRef = useRef<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Shared wide-screen inner width for tabs and image alignment (xl+)
  const showcaseWideInner = "mx-auto w-full xl:max-w-6xl";

  // Detect horizontal scrollbar height and expose as CSS variable
  // This ensures sticky tabs at bottom of viewport are fully visible above the scrollbar
  React.useEffect(() => {
    const updateScrollbarHeight = () => {
      // Check if there's horizontal overflow that would cause a horizontal scrollbar
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
      
      if (hasHorizontalScroll) {
        // Calculate horizontal scrollbar height by creating a temporary element
        // and measuring the difference between offsetWidth and clientWidth
        const scrollbarDiv = document.createElement('div');
        scrollbarDiv.style.width = '100px';
        scrollbarDiv.style.height = '100px';
        scrollbarDiv.style.overflow = 'scroll';
        scrollbarDiv.style.position = 'absolute';
        scrollbarDiv.style.top = '-9999px';
        document.body.appendChild(scrollbarDiv);
        
        // The horizontal scrollbar height is the difference between offsetHeight and clientHeight
        const horizontalScrollbarHeight = scrollbarDiv.offsetHeight - scrollbarDiv.clientHeight;
        document.body.removeChild(scrollbarDiv);
        
        // Fallback to standard Windows scrollbar height (17px) if calculation fails
        const height = horizontalScrollbarHeight > 0 ? horizontalScrollbarHeight : 17;
        document.documentElement.style.setProperty('--scrollbar-h', `${height}px`);
      } else {
        document.documentElement.style.setProperty('--scrollbar-h', '0px');
      }
    };

    updateScrollbarHeight();
    window.addEventListener('resize', updateScrollbarHeight);
    // Use MutationObserver to detect DOM changes that might cause overflow
    const observer = new MutationObserver(updateScrollbarHeight);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    // Also check after a brief delay to catch dynamic content loading
    const timeoutId = setTimeout(updateScrollbarHeight, 100);

    return () => {
      window.removeEventListener('resize', updateScrollbarHeight);
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  // Showcase images are served from public/ for reliability and simplicity

  interface TabData extends TabItem {
    content: React.ReactNode;
  }

  const tabsData: TabData[] = [
    {
      id: "corso-ai",
      label: "AI Chat",
      content: (
        <div className="rounded-lg border border-border shadow-md ring-1 ring-border/20 overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/corso-ai-interface.png"
              alt="AI Chat interface demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={false}
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      ),
    },
    {
      id: "projects",
      label: "Projects",
      content: (
        <div className="rounded-lg border border-border shadow-md ring-1 ring-border/20 overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/projects-interface.png"
              alt="Projects dashboard demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={false}
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      ),
    },
    {
      id: "companies",
      label: "Companies",
      content: (
        <div className="rounded-lg border border-border shadow-md ring-1 ring-border/20 overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/companies-interface.png"
              alt="Companies dashboard demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={false}
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      ),
    },
    {
      id: "addresses",
      label: "Addresses",
      content: (
        <div className="rounded-lg border border-border shadow-md ring-1 ring-border/20 overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/addresses-interface.png"
              alt="Addresses dashboard demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={false}
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      ),
    },
  ];

  // Track analytics when tab changes due to user interaction
  useEffect(() => {
    // Don't track on initial mount
    if (!isUserInteraction || previousTabRef.current === activeTab) {
      return;
    }

    const currentTab = tabsData[activeTab];
    if (currentTab) {
      try {
        trackEvent('product_showcase_tab_selected', {
          tabId: currentTab.id,
          tabLabel: currentTab.label,
          section: 'product_showcase',
        });
      } catch (error) {
        // Analytics failures should not break the UI
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[ProductShowcase] Analytics tracking failed:', error);
        }
      }
    }

    previousTabRef.current = activeTab;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isUserInteraction]);

  const current = tabsData[activeTab];

  const handleTabChange = (index: number) => {
    // Stop auto-advance immediately when user interacts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsUserInteraction(true);
    setActiveTab(index);
  };

  // Auto-advance tabs when section is in viewport
  useEffect(() => {
    // Don't auto-advance if user prefers reduced motion or has interacted
    if (prefersReducedMotion || isUserInteraction) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    // IntersectionObserver to detect when section is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !intervalRef.current) {
          // Start auto-advance when section is visible
          intervalRef.current = window.setInterval(() => {
            setActiveTab((prev) => (prev + 1) % tabsData.length);
          }, 5000);
        } else if (!entry.isIntersecting && intervalRef.current) {
          // Stop auto-advance when section is out of view
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      },
      { threshold: 0.5 } // Section must be at least 50% visible
    );

    observer.observe(sectionEl);

    // Pause on hover
    const handleHoverStart = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };

    const handleHoverEnd = () => {
      // Only resume if section is still in viewport and user hasn't interacted
      if (!intervalRef.current && !isUserInteraction && isIntersectingRef.current) {
        intervalRef.current = window.setInterval(() => {
          setActiveTab((prev) => (prev + 1) % tabsData.length);
        }, 5000);
      }
    };

    // Pause on focus (keyboard navigation)
    const handleFocusIn = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };

    sectionEl.addEventListener("mouseenter", handleHoverStart);
    sectionEl.addEventListener("mouseleave", handleHoverEnd);
    sectionEl.addEventListener("focusin", handleFocusIn);

    return () => {
      observer.disconnect();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      sectionEl.removeEventListener("mouseenter", handleHoverStart);
      sectionEl.removeEventListener("mouseleave", handleHoverEnd);
      sectionEl.removeEventListener("focusin", handleFocusIn);
    };
  }, [prefersReducedMotion, isUserInteraction, tabsData.length]);

  return (
    <section 
      ref={sectionRef}
      className={cn(
        "relative",
        className
      )} 
      {...props}
    >
      {/* Dashed horizontal line decoration */}
      <svg 
        aria-hidden="true"
        className="absolute inset-x-0 top-12 lg:top-10 text-border/25 pointer-events-none"
        height="1"
        preserveAspectRatio="none"
      >
        <line 
          x1="0" 
          y1="0" 
          x2="100%" 
          y2="0" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
      </svg>

      {/* ShowcaseFrame: Wrapper for tabs + gap + spacer to mock top edge with vertical dashed guides */}
      <div className="relative">
        {/* Vertical dashed guides (decorative) - bracket outer edges of tab grid and extend to mock top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 right-0 z-0"
        >
          {/* Inner wrapper that matches tab/image width constraints for proper guide alignment */}
          <div className={cn(
            containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true }),
            "relative h-full"
          )}>
            <div className={cn("relative h-full w-full", showcaseWideInner)}>
              {/* Left guide - aligns with outer left edge of tab grid */}
              <div
                className="absolute inset-y-0 left-0 w-px"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--border) / 0.4) 4px, hsl(var(--border) / 0.4) 10px)',
                }}
              />
              {/* Right guide - aligns with outer right edge of tab grid */}
              <div
                className="absolute inset-y-0 right-0 w-px"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--border) / 0.4) 4px, hsl(var(--border) / 0.4) 10px)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Sticky tabs container - positioned at bottom of viewport */}
        {/* Accounts for navbar height, mobile CTA ribbon, and horizontal scrollbar height */}
        {/* On mobile, tabs sit above the mobile CTA ribbon (which is ~60-70px tall) */}
        {/* On desktop, tabs sit above horizontal scrollbar (typically 15-17px on Windows) */}
        {/* Uses containerWithPaddingVariants to align with FullWidthSection guidelines */}
        <div 
          className={cn(
            "sticky z-[45] bg-showcase relative",
            // On mobile, add bottom padding to account for mobile CTA ribbon (~70px tall)
            // On desktop, account for horizontal scrollbar using CSS variable (falls back to 17px)
            "bottom-[70px] md:bottom-[var(--scrollbar-h,17px)]",
            // Ensure tabs are above content and mobile CTA (mobile CTA is z-40) but below navbar (navbar is z-50)
          )}
        >
          <div className={cn(
            containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true })
          )}>
            {/* Narrow tab row on wide screens (xl+) to align with image */}
            <div
              className={cn(
                "w-full",
                showcaseWideInner,
                // ─────────────────────────────────────────────────────────────
                // XL+ TYPOGRAPHY TIGHTEN (scoped)
                "xl:[&_[role=tab]]:text-[14px]",
                "xl:[&_[role=tab]]:leading-5",
                "xl:[&_[role=tab]]:tracking-[-0.01em]",
                "xl:[&_[role=tab]]:px-3",
                // ─────────────────────────────────────────────────────────────
                // XL+ ATTIO-LIKE WEIGHTS (inactive normal, active medium)
                // default all tabs to normal
                "xl:[&_[role=tab]]:font-normal",
                // active only (most specific + reliable)
                "xl:[&_[role=tab][data-state='active']]:font-medium",
                // ─────────────────────────────────────────────────────────────
                // OPTIONAL (Recommended): prevent weight jumping on hover in xl+
                // If current TabSwitcher styles include hover:font-medium, neutralize it on xl+
                "xl:[&_[role=tab]]:hover:font-normal",
                // Keep active tab medium even on hover
                "xl:[&_[role=tab][data-state='active']]:hover:font-medium"
              )}
            >
              <TabSwitcher
                tabs={tabsData}
                active={activeTab}
                onTabChange={handleTabChange}
                alignment="center"
                variant="default"
                layout="grid"
                buttonVariant="grid"
                gridSeparators={true}
                aria-label="Choose a dashboard view"
              />
            </div>
          </div>
        </div>

        {/* Spacer: gap + mt-2xl to reach mock top edge (defines guide height) */}
        <div className="mt-sm md:mt-md">
          <div className="mt-2xl" />
        </div>
      </div>

      {/* Content container - mock rendered here, positioned immediately after ShowcaseFrame */}
      {/* Guides stop at ShowcaseFrame bottom which aligns with mock top edge */}
      <div className={cn(
        containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true }),
        "relative z-10"
      )}>
        {/* Render the content for the active tab with ARIA-compliant tabpanel */}
        <div
          id={`panel-${current?.id ?? 'active'}`}
          role="tabpanel"
          aria-labelledby={`tab-${current?.id ?? 'active'}`}
          aria-live="polite"
        >
          {current ? (
            <div
              ref={contentRef}
              key={current.id}
              className={cn(
                // Transition animation - fade up (respects prefers-reduced-motion via CSS)
                'animate-fadeInUp',
                // Mobile: full-bleed, Desktop: constrained + padded
                "mx-[calc(50%-50vw)] max-w-screen px-4 sm:px-6",
                // lg: keep current desktop behavior
                "lg:mx-0 lg:px-20",
                // xl+: wider mock/image aligned with tab row outer edges
                "xl:mx-auto xl:max-w-6xl xl:px-0"
              )}
            >
              {current.content}
            </div>
          ) : null}
        </div>
      </div>

      {/* Content container bottom margin - outside ShowcaseFrame so guides don't extend too far */}
      <div className="mb-4xl" />
    </section>
  );
}
