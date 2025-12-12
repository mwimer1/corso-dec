// components/dashboard/layout/dashboard-layout.tsx
"use client";

// Dashboard context removed - using local state
import { cn } from "@/styles";
import { dashboardShellVariants } from "@/styles/ui/organisms";
import * as React from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopBar } from "./dashboard-top-bar";

/**
 * DashboardLayout – Wraps dashboard pages with top bar and side navigation.
 * Expects to be used in protected route where Dashboard context is provided.
 */
export const DashboardLayout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function DashboardLayout({ className, children, ...props }, ref) {
  // Dashboard context removed - using local state
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [_section, setSection] = React.useState('overview');

  const toggleSidebar = React.useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);
  return (
    <div className="flex h-screen flex-col bg-[#E7EBEE]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 p-2 bg-primary text-primary-foreground"
      >
        Skip to main content
      </a>
      {/* Top navigation bar */}
      <DashboardTopBar />
      {/* Main content area with sidebar + page content */}
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          sidebarCollapsed={sidebarCollapsed}
          setSection={setSection}
          toggleSidebar={toggleSidebar}
        />
        <div
          ref={ref}
          id="main-content"
          tabIndex={-1}
          className={cn(
            // Single-scroll contract: this node must not scroll; children manage it
            "flex min-h-0 overflow-hidden flex-col bg-[#E7EBEE]",
            dashboardShellVariants({
              sidebar: sidebarCollapsed ? "collapsed" : "expanded",
            }),
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    </div>
  );
});

DashboardLayout.displayName = "DashboardLayout";
