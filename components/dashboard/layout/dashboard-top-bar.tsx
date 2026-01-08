"use client";

import { cn } from "@/styles";
import { navbarLayout } from "@/styles/ui/organisms";

interface DashboardTopBarProps {
  /** Page title displayed on the left. Optional; can fall back to org name. */
  title?: string;
  /** Optional organization name for fallback when title is not provided. */
  orgName?: string;
  /** Optional right-aligned action area (buttons, menus, etc). */
  actions?: React.ReactNode;
  /** Optional extra classes for custom page-specific styling. */
  className?: string;
}

/** 🔴 Organism: Fixed top bar in protected dashboard layout. */
export function DashboardTopBar({ title, orgName, actions, className }: DashboardTopBarProps) {
  navbarLayout();
  return (
    // Outer header intentionally has no global padding; inner containers control spacing
    <header className={cn("border-b border-border bg-surface", className)}>
      <div className="flex items-center gap-lg">
        {(title || orgName) && (
          <h1 className="text-lg font-medium">
            {title ?? orgName}
          </h1>
        )}
        {title && orgName && (
          <span
            className="text-base font-semibold text-primary"
            data-testid="org-name"
          >
            {orgName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-sm">{actions}</div>
    </header>
  );
}
