// components/landing/sections/product-showcase/product-showcase.tsx
"use client";

import { TabSwitcher, type TabItem } from "./tab-switcher";
import { trackEvent } from "@/lib/shared/analytics/track";
import { cn } from "@/styles";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import usePrefersReducedMotion from "../../hooks/use-prefers-reduced-motion";
import { containerWithPaddingVariants } from "@/styles/ui/shared";

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
  const railsWrapperRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // Tab strip width (narrower than image) - used for aligning dashed rails
  const showcaseTabInner = "mx-auto w-full xl:max-w-5xl";

  // Detect horizontal scrollbar height and expose as CSS variable
  // This ensures sticky tabs at bottom of viewport are fully visible above the scrollbar
  // Simplified: only checks on mount and resize (MutationObserver removed for performance)
  React.useEffect(() => {
    const updateScrollbarHeight = () => {
      // Check if there's horizontal overflow that would cause a horizontal scrollbar
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
      
      if (hasHorizontalScroll) {
        // Calculate horizontal scrollbar height by creating a temporary element
        const scrollbarDiv = document.createElement('div');
        scrollbarDiv.style.cssText = 'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px';
        document.body.appendChild(scrollbarDiv);
        
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

    return () => {
      window.removeEventListener('resize', updateScrollbarHeight);
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
        <div className="rounded-lg border-2 border-border shadow-md overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/corso-ai-interface.png"
              alt="AI Chat interface demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1024px"
            />
          </div>
        </div>
      ),
    },
    {
      id: "projects",
      label: "Projects",
      content: (
        <div className="rounded-lg border-2 border-border shadow-md overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/projects-interface.png"
              alt="Projects dashboard demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1024px"
            />
          </div>
        </div>
      ),
    },
    {
      id: "companies",
      label: "Companies",
      content: (
        <div className="rounded-lg border-2 border-border shadow-md overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/companies-interface.png"
              alt="Companies dashboard demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1024px"
            />
          </div>
        </div>
      ),
    },
    {
      id: "addresses",
      label: "Addresses",
      content: (
        <div className="rounded-lg border-2 border-border shadow-md overflow-hidden">
          <div className="u-mask-fade-bottom">
            <Image
              src="/demos/addresses-interface.png"
              alt="Addresses dashboard demo"
              width={1920}
              height={1080}
              className="block w-full h-auto"
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1024px"
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

  // Update dashed rails height to span from tabs to product image top edge
  useEffect(() => {
    const updateRailsHeight = () => {
      if (!railsWrapperRef.current || !tabContainerRef.current || !contentContainerRef.current) return;

      const railsWrapper = railsWrapperRef.current;
      const tabContainer = tabContainerRef.current;
      const contentContainer = contentContainerRef.current;
      
      // Get the ShowcaseFrame parent container
      const parent = railsWrapper.parentElement as HTMLElement;
      if (!parent) return;

      // Get positions relative to the viewport
      const parentRect = parent.getBoundingClientRect();
      const tabRect = tabContainer.getBoundingClientRect();
      const contentRect = contentContainer.getBoundingClientRect();

      // Calculate: start from top of tabs, end at top of content
      const topOffset = tabRect.top - parentRect.top;
      const height = contentRect.top - parentRect.top - topOffset;
      
      railsWrapper.style.top = `${topOffset}px`;
      railsWrapper.style.height = `${Math.max(0, height)}px`;
    };

    updateRailsHeight();
    window.addEventListener('resize', updateRailsHeight);
    // Also update after a brief delay to account for layout shifts
    const timeoutId = setTimeout(updateRailsHeight, 100);

    return () => {
      window.removeEventListener('resize', updateRailsHeight);
      clearTimeout(timeoutId);
    };
  }, [activeTab]); // Recalculate when tab changes (image height may vary)

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
      {/* ShowcaseFrame: Wrapper for tabs + gap + spacer to mock top edge with vertical dashed guides */}
      <div className="relative">
        {/* Dashed vertical rails - span from tabs to product image */}
        <div
          ref={railsWrapperRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 z-[46]"
        >
          {/* Inner wrapper that matches tab width constraints for proper guide alignment */}
          <div className={cn(
            containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true }),
            "relative h-full"
          )}>
            <div className={cn("relative h-full w-full", showcaseTabInner)}>
              {/* Left dashed rail - darker and thicker for better visibility */}
              <div
                className="absolute inset-y-0 left-0 w-[1.5px]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--border) / 0.7) 4px, hsl(var(--border) / 0.7) 10px)',
                }}
              />
              {/* Right dashed rail - darker and thicker for better visibility */}
              <div
                className="absolute inset-y-0 right-0 w-[1.5px]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent, transparent 4px, hsl(var(--border) / 0.7) 4px, hsl(var(--border) / 0.7) 10px)',
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
            {/* Tab row wrapper - narrower than image, matches dashed rails alignment */}
            <div ref={tabContainerRef} className={cn("w-full", showcaseTabInner)}>
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

        {/* Spacer: gap + responsive spacing to reach mock top edge (defines guide height) */}
        {/* Increased by ~20%: 58px mobile, 65px desktop for improved visual breathing room */}
        <div className="mt-md md:mt-md">
          <div className="mt-[42px] md:mt-[49px]" />
        </div>

        {/* Content container - moved inside ShowcaseFrame so dashed rails span down to image area */}
        <div 
          ref={contentContainerRef}
          className={cn(
            containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true }),
            "relative z-[45]"
          )}
        >
          {/* Render the content for the active tab with ARIA-compliant tabpanel */}
          <div
            id={`panel-${current?.id ?? 'active'}`}
            role="tabpanel"
            aria-labelledby={`tab-${current?.id ?? 'active'}`}
            aria-live={isUserInteraction || prefersReducedMotion ? "polite" : "off"}
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
                  // lg: balanced padding for desktop
                  "lg:mx-0 lg:px-12",
                  // xl+: wider mock/image, slightly wider than tabs for better visual alignment
                  "xl:mx-auto xl:max-w-7xl xl:px-0"
                )}
              >
                {current.content}
              </div>
            ) : null}
          </div>
        </div>

        {/* Content container bottom margin - inside ShowcaseFrame so rails include this space */}
        <div className="mb-2xl" />
      </div>
    </section>
  );
}
