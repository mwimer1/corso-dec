// components/dashboard/layout/dashboard-layout.tsx
"use client";

// Dashboard context removed - using local state
import { SkipNavLink } from "@/components/ui/atoms";
import { cn } from "@/styles";
import { dashboardShellVariants } from "@/styles/ui/organisms";
import { usePathname } from "next/navigation";
import * as React from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopBar } from "./dashboard-top-bar";

/**
 * Maps pathname segments to page titles for the top bar.
 */
function getPageTitle(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  
  // Extract entity from pathname like /dashboard/projects -> "Projects"
  const match = pathname.match(/\/dashboard\/([^/]+)/);
  if (!match || !match[1]) return undefined;

  const segment = match[1];
  const titleMap: Record<string, string> = {
    projects: "Projects",
    companies: "Companies",
    addresses: "Addresses",
    account: "Account",
    subscription: "Subscription",
  };

  return segment in titleMap ? titleMap[segment] : undefined;
}

interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show the top bar. Defaults to true. */
  showTopBar?: boolean;
}

/**
 * DashboardLayout – Wraps dashboard pages with top bar and side navigation.
 * Expects to be used in protected route where Dashboard context is provided.
 * 
 * @param showTopBar - If false, the top bar is not rendered. Defaults to true.
 */
export const DashboardLayout = React.forwardRef<
  HTMLDivElement,
  DashboardLayoutProps
>(function DashboardLayout({ className, children, showTopBar = true, ...props }, ref) {
  // Dashboard context removed - using local state
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [_section, setSection] = React.useState('overview');
  const pathname = usePathname();
  const pageTitle = React.useMemo(() => {
    if (!pathname || !showTopBar) return undefined;
    return getPageTitle(pathname);
  }, [pathname, showTopBar]);

  const toggleSidebar = React.useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);
  return (
    <div className="flex h-screen flex-col bg-background">
      <SkipNavLink />
      {/* Top navigation bar - conditionally rendered based on showTopBar prop */}
      {showTopBar && pageTitle && <DashboardTopBar title={pageTitle} />}
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
            "flex min-h-0 overflow-hidden flex-col bg-background",
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
