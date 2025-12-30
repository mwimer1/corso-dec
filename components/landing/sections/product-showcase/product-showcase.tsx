// components/marketing/landing/product-showcase/product-showcase.tsx
"use client";

import { TabSwitcher, type TabItem } from "@/components/ui/molecules";
import { trackEvent } from "@/lib/shared/analytics/track";
import { cn } from "@/styles";
import { containerWithPaddingVariants } from "@/styles/ui/shared/container-helpers";
import Image from "next/image";
import React, { useEffect, useRef } from "react";

interface ProductShowcaseProps extends React.HTMLAttributes<HTMLDivElement> {}

/** ProductShowcase – Interactive dashboard view switcher using global TabSwitcher. */
export function ProductShowcase({ className, ...props }: ProductShowcaseProps) {
  const [activeTab, setActiveTab] = React.useState(0);
  const [isUserInteraction, setIsUserInteraction] = React.useState(false);
  const previousTabRef = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

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
        <div className="rounded-lg border border-border shadow-sm overflow-hidden">
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
        <div className="rounded-lg border border-border shadow-sm overflow-hidden">
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
        <div className="rounded-lg border border-border shadow-sm overflow-hidden">
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
        <div className="rounded-lg border border-border shadow-sm overflow-hidden">
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
    setIsUserInteraction(true);
    setActiveTab(index);
  };

  return (
    <section 
      className={cn(
        "relative border-t border-border/60 bg-gradient-to-b from-background to-muted/20",
        className
      )} 
      {...props}
    >
      {/* Dashed horizontal line decoration */}
      <svg 
        aria-hidden="true"
        className="absolute inset-x-0 top-12 lg:top-10 text-border/40 pointer-events-none"
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

      {/* Sticky tabs container - positioned at bottom of viewport */}
      {/* Accounts for navbar height, mobile CTA ribbon, and horizontal scrollbar height */}
      {/* On mobile, tabs sit above the mobile CTA ribbon (which is ~60-70px tall) */}
      {/* On desktop, tabs sit above horizontal scrollbar (typically 15-17px on Windows) */}
      {/* Uses containerWithPaddingVariants to align with FullWidthSection guidelines */}
      <div 
        className={cn(
          "sticky z-[45] bg-background/95 backdrop-blur-sm",
          // On mobile, add bottom padding to account for mobile CTA ribbon (~70px tall)
          // On desktop, account for horizontal scrollbar using CSS variable (falls back to 17px)
          "bottom-[70px] md:bottom-[var(--scrollbar-h,17px)]",
          // Ensure tabs are above content and mobile CTA (mobile CTA is z-40) but below navbar (navbar is z-50)
        )}
      >
        <div className={cn(
          containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true })
        )}>
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

      {/* Content container with proper spacing - reduced bottom margin from mb-5xl to mb-4xl for tighter layout */}
      {/* Uses containerWithPaddingVariants to align with FullWidthSection guidelines */}
      <div className={cn(
        containerWithPaddingVariants({ maxWidth: '7xl', padding: 'lg', centered: true }),
        "mt-sm md:mt-md mb-4xl relative"
      )}>
        {/* Dashed vertical guides bracketing the tab+mock area on desktop */}
        <svg 
          aria-hidden="true"
          className="hidden lg:block absolute -left-px inset-y-0 text-border/40 pointer-events-none"
          width="1"
          preserveAspectRatio="none"
        >
          <line 
            x1="0" 
            y1="0" 
            x2="0" 
            y2="100%" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
        </svg>
        <svg 
          aria-hidden="true"
          className="hidden lg:block absolute -right-px inset-y-0 text-border/40 pointer-events-none"
          width="1"
          preserveAspectRatio="none"
        >
          <line 
            x1="0" 
            y1="0" 
            x2="0" 
            y2="100%" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
        </svg>

        {/* Render the content for the active tab with ARIA-compliant tabpanel */}
        <div
          id={`panel-${current?.id ?? 'active'}`}
          role="tabpanel"
          aria-labelledby={`tab-${current?.id ?? 'active'}`}
          aria-live="polite"
          className="mt-2xl"
        >
          {current ? (
            <div
              ref={contentRef}
              key={current.id}
              className={cn(
                // Transition animation - fade up (respects prefers-reduced-motion via CSS)
                'animate-fadeInUp',
                // Mobile: full-bleed, Desktop: constrained + padded
                "mx-[calc(50%-50vw)] max-w-screen px-4 sm:px-6 lg:mx-0 lg:px-20"
              )}
            >
              {current.content}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
