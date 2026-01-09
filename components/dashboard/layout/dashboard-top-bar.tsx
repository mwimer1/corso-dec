"use client";

import { cn } from "@/styles";
import Link from "next/link";
import * as React from "react";
import type { BreadcrumbItem } from '@/types/shared';

interface DashboardTopBarProps {
  /** Optional breadcrumb trail items before current page */
  breadcrumbs?: BreadcrumbItem[];
  /** Current page label (always shown) */
  currentPage: string;
  /** Optional right-aligned action area (buttons, menus, etc) */
  actions?: React.ReactNode;
  /** Optional extra classes for custom page-specific styling */
  className?: string;
  /** Layout variant: 'default' (breadcrumbs left, actions right) or 'chat' (combined left) */
  variant?: 'default' | 'chat';
}

/**
 * DashboardTopBar – Consistent top bar with breadcrumbs and current page label.
 * Used across entity pages and chat page for consistent navigation.
 * 
 * Variants:
 * - 'default': Breadcrumbs on left, actions on right (entity pages)
 * - 'chat': Combined breadcrumb + actions on left (chat page)
 */
export function DashboardTopBar({ 
  breadcrumbs = [], 
  currentPage, 
  actions, 
  className,
  variant = 'default',
}: DashboardTopBarProps) {
  const hasBreadcrumbs = breadcrumbs.length > 0;
  const isChatVariant = variant === 'chat';

  return (
    <header 
      data-dashboard-top-bar
      data-variant={variant}
      className={cn(
        "py-4 bg-background",
        isChatVariant ? "pl-xs pr-6" : "px-6", // Tokenized spacing: pl-xs (4px) for chat, px-6 for default
        !isChatVariant && "border-b border-border", // Only show border for non-chat variant
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left side: Breadcrumbs + Current Page + (Actions if chat variant) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Breadcrumb trail */}
          {hasBreadcrumbs && (
            <nav className="flex items-center space-x-2 text-lg text-muted-foreground" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => {
                const crumbKey = crumb.href ?? `crumb-${crumb.label}-${index}`;
                return (
                  <React.Fragment key={crumbKey}>
                    {index > 0 && <span className="text-lg text-medium"> &gt; </span>}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-foreground transition-colors truncate"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate">{crumb.label}</span>
                    )}
                  </React.Fragment>
                );
              })}
              {hasBreadcrumbs && <span className="text-lg text-medium"> &gt; </span>}
            </nav>
          )}
          {/* Chat variant: Show integrated Corso [Model] dropdown (no breadcrumbs) */}
          {isChatVariant ? (
            <div className="flex items-center gap-2 min-w-0">
              {actions}
            </div>
          ) : (
            /* Default variant: Current page title only - same lighter color as breadcrumb */
            <h1 className="text-lg font-medium text-muted-foreground truncate">
              {currentPage}
            </h1>
          )}
        </div>
        {/* Right side: Actions (default variant only) */}
        {!isChatVariant && actions && (
          <div className="flex-shrink-0 ml-4">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
