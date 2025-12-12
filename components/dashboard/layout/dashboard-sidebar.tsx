"use client";

// Feature flags removed - using default behavior
import { useSubscriptionStatus } from "@/hooks/shared/use-subscription-status";
import {
    DASHBOARD_NAV_ITEMS,
    getAvailableNavItems,
    isNavItemActive,
} from "@/lib/dashboard";
import { trackNavClick } from "@/lib/shared";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import * as React from "react";
import { SidebarItem } from "../sidebar/sidebar-item";
import { SidebarRoot } from "../sidebar/sidebar-root";
import { SidebarTop } from "../sidebar/sidebar-top";
import { SidebarUserProfile } from "../sidebar/sidebar-user-profile";

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
    // Feature flags removed - using all available nav items
    const availableItems = React.useMemo(() => {
      return getAvailableNavItems({ features: {} });
    }, []);

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
            {(availableItems.length ? availableItems : DASHBOARD_NAV_ITEMS).map(
              ({ href, label, icon }) => {
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
              },
            )}
          </nav>
        </div>
      </SidebarRoot>
    );
  },
);

DashboardSidebar.displayName = "DashboardSidebar";
