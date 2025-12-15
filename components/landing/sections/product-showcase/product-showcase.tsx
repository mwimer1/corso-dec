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
      {/* Accounts for navbar height and mobile CTA ribbon on mobile */}
      {/* On mobile, tabs sit above the mobile CTA ribbon (which is ~60-70px tall) */}
      <div 
        className={cn(
          "sticky z-[45] bg-background border-b border-border",
          // On mobile, add bottom padding to account for mobile CTA ribbon (~70px tall)
          // On desktop, tabs sit at the very bottom
          "bottom-[70px] md:bottom-0",
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

      {/* Content container with proper spacing */}
      <div className={cn(
        containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }),
        "mt-xl mb-5xl"
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
