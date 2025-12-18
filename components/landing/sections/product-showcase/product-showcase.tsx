// components/marketing/landing/product-showcase/product-showcase.tsx
"use client";

import { TabSwitcher, type TabItem } from "@/components/ui/molecules";
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import Image from "next/image";
import React from "react";

interface ProductShowcaseProps extends React.HTMLAttributes<HTMLDivElement> {}

/** ProductShowcase – Interactive dashboard view switcher using global TabSwitcher. */
export function ProductShowcase({ className, ...props }: ProductShowcaseProps) {
  const [activeTab, setActiveTab] = React.useState(0);

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
      id: "projects",
      label: "Projects",
      content: (
        <Image
          src="/demos/projects-interface.png"
          alt="Projects dashboard demo"
          width={1920}
          height={1080}
          className="mx-auto max-w-5xl w-full rounded-lg border border-border shadow-sm h-auto"
          priority={false}
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      ),
    },
    {
      id: "companies",
      label: "Companies",
      content: (
        <Image
          src="/demos/companies-interface.png"
          alt="Companies dashboard demo"
          width={1920}
          height={1080}
          className="mx-auto max-w-5xl w-full rounded-lg border border-border shadow-sm h-auto"
          priority={false}
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      ),
    },
    {
      id: "addresses",
      label: "Addresses",
      content: (
        <Image
          src="/demos/addresses-interface.png"
          alt="Addresses dashboard demo"
          width={1920}
          height={1080}
          className="mx-auto max-w-5xl w-full rounded-lg border border-border shadow-sm h-auto"
          priority={false}
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      ),
    },
    {
      id: "corso-ai",
      label: "CorsoAI",
      content: (
        <Image
          src="/demos/corso-ai-interface.png"
          alt="CorsoAI interface demo"
          width={1920}
          height={1080}
          className="mx-auto max-w-5xl w-full rounded-lg border border-border shadow-sm h-auto"
          priority={false}
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      ),
    },
  ];

  const current = tabsData[activeTab];

  return (
    <section 
      className={cn(
        "relative",
        className
      )} 
      {...props}
    >
      {/* Sticky tabs container - positioned at bottom of viewport */}
      {/* Accounts for navbar height, mobile CTA ribbon, and horizontal scrollbar height */}
      {/* On mobile, tabs sit above the mobile CTA ribbon (which is ~60-70px tall) */}
      {/* On desktop, tabs sit above horizontal scrollbar (typically 15-17px on Windows) */}
      <div 
        className={cn(
          "sticky z-[45] bg-background",
          // On mobile, add bottom padding to account for mobile CTA ribbon (~70px tall)
          // On desktop, account for horizontal scrollbar using CSS variable (falls back to 17px)
          "bottom-[70px] md:bottom-[var(--scrollbar-h,17px)]",
          // Ensure tabs are above content and mobile CTA (mobile CTA is z-40) but below navbar (navbar is z-50)
        )}
      >
        <div className={cn(
          containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true })
        )}>
          <TabSwitcher
            tabs={tabsData}
            active={activeTab}
            onTabChange={setActiveTab}
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
      <div className={cn(
        containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }),
        "mt-sm md:mt-md mb-4xl"
      )}>
        {/* Render the content for the active tab with ARIA-compliant tabpanel */}
        <div
          id={`panel-${current?.id ?? 'active'}`}
          role="tabpanel"
          aria-labelledby={`tab-${current?.id ?? 'active'}`}
          className="mt-2xl"
        >
          {current ? current.content : null}
        </div>
      </div>
    </section>
  );
}
