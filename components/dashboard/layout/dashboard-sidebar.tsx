"use client";

// Feature flags removed - using default behavior
import { useSubscriptionStatus } from "@/components/ui/hooks/use-subscription-status";
import { trackNavClick } from "@/lib/shared";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as React from "react";
import { SidebarItem } from "../sidebar/sidebar-item";
import { SidebarRoot } from "../sidebar/sidebar-root";
import { SidebarTop } from "../sidebar/sidebar-top";
import { SidebarUserProfile } from "../sidebar/sidebar-user-profile";
import {
    getAvailableNavItems,
    isNavItemActive,
} from "./dashboard-nav";

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLElement> {
  sidebarCollapsed: boolean;
  setSection: (section: string) => void;
  toggleSidebar: () => void;
}

export const DashboardSidebar = React.forwardRef<HTMLElement, DashboardSidebarProps>(
  function DashboardSidebar(
    { sidebarCollapsed, setSection, toggleSidebar },
    _ref,
  ) {
    const pathname = usePathname();
    const { user } = useUser();
    const { planLabel } = useSubscriptionStatus();
    
    // Extract user role from Clerk session claims or public metadata
    const userRole = React.useMemo(() => {
      if (!user) return null;
      
      // Try to get role from session claims (if configured in Clerk)
      const sessionClaims = (user as any)?.sessionClaims;
      if (sessionClaims?.metadata?.role) {
        return sessionClaims.metadata.role as 'owner' | 'admin' | 'member' | 'viewer' | 'service';
      }
      
      // Fallback: try public metadata
      const publicMetadata = user.publicMetadata as { role?: string };
      if (publicMetadata?.role) {
        return publicMetadata.role as 'owner' | 'admin' | 'member' | 'viewer' | 'service';
      }
      
      // Default to 'member' if no role is set (backward compatibility)
      return 'member';
    }, [user]);
    
    // Filter nav items based on user role
    const availableItems = React.useMemo(() => {
      return getAvailableNavItems({ role: userRole, features: {} });
    }, [userRole]);

    React.useEffect(() => {
      const active = availableItems.find((item) =>
        isNavItemActive(pathname, item.href)
      );
      if (active) {
        setSection(active.label.toLowerCase());
      }
    }, [pathname, setSection, availableItems]);

    const footerContent = (
      <SidebarUserProfile
        userName={user?.firstName ?? user?.fullName ?? null}
        planLabel={planLabel}
      />
    );

    return (
      <SidebarRoot
        id="dashboard-sidebar"
        collapsed={sidebarCollapsed}
        footer={footerContent}
      >
        <SidebarTop
          isOpen={!sidebarCollapsed}
          onToggle={toggleSidebar}
          sidebarId="dashboard-sidebar"
        />

        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-0.5 px-2 py-2">
            {availableItems.length > 0 ? (
              availableItems.map(({ href, label, icon }) => {
                const isActive = isNavItemActive(pathname, href);
                return (
                  <SidebarItem
                    key={href}
                    href={href === "/dashboard/chat" ? `${href}?new=true` : href}
                    label={label}
                    icon={icon}
                    isActive={isActive}
                    onClick={() => trackNavClick(label, href)}
                  />
                );
              })
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground">
                No sections available
              </div>
            )}
          </nav>
        </div>
      </SidebarRoot>
    );
  },
);

DashboardSidebar.displayName = "DashboardSidebar";
