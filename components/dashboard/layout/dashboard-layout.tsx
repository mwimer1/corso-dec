// components/dashboard/layout/dashboard-layout.tsx
"use client";

// Dashboard context removed - using local state
import { SkipNavLink } from "@/components/ui/atoms";
import { cn } from "@/styles";
import { dashboardShellVariants } from "@/styles/ui/organisms";
import { usePathname } from "next/navigation";
import * as React from "react";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content width variant.
   * - "dashboard": Uses max-width container (1600px) for better readability on wide screens (default)
   * - "full": Full-width layout for dense grid views or specific pages
   */
  contentWidth?: "dashboard" | "full";
}

/**
 * DashboardLayout – Wraps dashboard pages with side navigation.
 * Expects to be used in protected route where Dashboard context is provided.
 * 
 * Note: The top bar has been removed globally to maximize vertical space.
 * Pages should render their own headings if needed.
 * 
 * Mobile behavior: Sidebar defaults to collapsed and acts as overlay drawer.
 * Desktop behavior: Sidebar uses inline collapsed/expanded behavior.
 */
export const DashboardLayout = React.forwardRef<
  HTMLDivElement,
  DashboardLayoutProps
>(function DashboardLayout({ className, children, contentWidth = "dashboard", ...props }, ref) {
  const pathname = usePathname();
  const [_section, setSection] = React.useState('overview');

  // Detect mobile viewport (md breakpoint = 768px)
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    // Initialize mobile state (client-side only)
    if (typeof window === 'undefined') return;
    
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    
    // Update on resize
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Default sidebar to collapsed on mobile, expanded on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    // Client-side only initialization
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  // Sync sidebar state with mobile state changes (only on resize, not user toggles)
  const isMobileRef = React.useRef(isMobile);
  React.useEffect(() => {
    // Only collapse if switching from desktop to mobile
    if (isMobile && !isMobileRef.current) {
      setSidebarCollapsed(true);
    }
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const toggleSidebar = React.useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Close sidebar on route change (mobile only)
  const prevPathnameRef = React.useRef(pathname);
  React.useEffect(() => {
    if (isMobile && prevPathnameRef.current !== pathname && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isMobile, sidebarCollapsed]);

  // Close sidebar on ESC key (mobile only)
  React.useEffect(() => {
    if (!isMobile || sidebarCollapsed) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMobile, sidebarCollapsed]);

  const maxWidthVariant = contentWidth === "full" ? "none" : "default";

  return (
    <div className="flex h-screen flex-col bg-background">
      <SkipNavLink />
      {/* Main content area with sidebar + page content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop overlay for mobile drawer */}
        {isMobile && !sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
        <DashboardSidebar
          sidebarCollapsed={sidebarCollapsed}
          setSection={setSection}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
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
              maxWidth: maxWidthVariant,
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
