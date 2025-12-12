// components/dashboard/sidebar/sidebar-user-profile.tsx
"use client";

import { cn } from "@/styles";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import styles from "./sidebar.module.css";

interface SidebarUserProfileProps {
  userName?: string | null;
  planLabel: string;
}

export function SidebarUserProfile({
  userName,
  planLabel,
}: SidebarUserProfileProps) {
  const { collapsed } = useSidebar();

  return (
    <div className={cn(
      styles['userProfile'],
      collapsed && styles['userProfileCollapsed']
    )}>
      <SignedIn>
        <div className={styles['userAvatar']}>
          <UserButton
            userProfileMode="navigation"
            userProfileUrl="/dashboard/account"
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonPopoverCard: "shadow-lg",
                userButtonAvatarBox: cn(
                  styles['avatarBox'],
                  collapsed ? styles['avatarBoxCollapsed'] : styles['avatarBoxExpanded']
                ),
                userButtonTrigger: styles['avatarTrigger']
              }
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action label="manageAccount" />
              <UserButton.Link
                label="Manage Subscription"
                href="/dashboard/subscription"
                labelIcon={<CreditCard className="h-4 w-4" aria-hidden />}
              />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </div>

        {!collapsed && (
          <div className={styles['userInfo']}>
            <p className={styles['userName']}>
              {userName || "Account"}
            </p>
            <p className={styles['userPlan']}>{planLabel}</p>
          </div>
        )}
      </SignedIn>
    </div>
  );
}
