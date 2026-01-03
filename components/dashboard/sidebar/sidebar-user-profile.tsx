// components/dashboard/sidebar/sidebar-user-profile.tsx
"use client";

import { cn } from "@/styles";
import { UserButton, useUser } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useSidebar } from "./sidebar-context";

interface SidebarUserProfileProps {
  userName?: string | null;
  planLabel: string;
}

export function SidebarUserProfile({
  userName,
  planLabel,
}: SidebarUserProfileProps) {
  const { collapsed } = useSidebar();
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  // Only render after client-side hydration to avoid SSR/client mismatch
  // (Clerk auth state may differ between server and client)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted and auth state is loaded
  if (!mounted || !isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center gap-3', // 0.75rem gap
      'py-2 px-3', // 0.5rem 0.75rem padding
      'w-full min-h-14', // 3.5rem min-height
      'transition-all duration-150',
      collapsed && 'justify-center px-2 py-3' // Collapsed padding
    )}>
      <div className="flex-shrink-0 flex items-center justify-center">
        <UserButton
          userProfileMode="navigation"
          userProfileUrl="/dashboard/account"
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonPopoverCard: "shadow-lg",
              userButtonAvatarBox: cn(
                'rounded-full overflow-hidden transition-all duration-150',
                collapsed ? 'w-7 h-7' : 'w-8 h-8' // 28px collapsed, 32px expanded
              ),
              userButtonTrigger: cn(
                'p-0 m-0 border-2 border-transparent rounded-full',
                'transition-[border-color] duration-150',
                'hover:border-[var(--sb-border-hover,rgba(0,0,0,0.1))]'
              )
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
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-sm font-medium leading-5', // 0.875rem, 500, 1.25rem
            'text-[var(--sb-ink)]',
            'truncate overflow-hidden text-ellipsis whitespace-nowrap'
          )}>
            {userName || "Account"}
          </p>
          <p className={cn(
            'text-xs leading-4', // 0.75rem, 1rem
            'text-[var(--sb-ink-muted,rgba(0,0,0,0.6))]',
            'truncate overflow-hidden text-ellipsis whitespace-nowrap'
          )}>
            {planLabel}
          </p>
        </div>
      )}
    </div>
  );
}
