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
    <section className={cn(containerMaxWidthVariants({ maxWidth: '7xl', centered: true, responsive: true }), "mt-xl mb-5xl", className)} {...props}>

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
      {/* Render the content for the active tab with ARIA-compliant tabpanel */}
      <div
        id={`panel-${current?.id ?? 'active'}`}
        role="tabpanel"
        aria-labelledby={`tab-${current?.id ?? 'active'}`}
        className="mt-2xl"
      >
        {current ? current.content : null}
      </div>
    </section>
  );
}
