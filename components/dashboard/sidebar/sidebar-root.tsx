"use client";

import { cn } from '@/styles';
import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { SidebarProvider } from './sidebar-context';
import { SidebarTooltipProvider } from './sidebar-tooltip-layer';

type Props = PropsWithChildren<{
  collapsed?: boolean; // controlled by composed layout
  footer?: ReactNode;
  isMobile?: boolean; // mobile drawer mode
}> & HTMLAttributes<HTMLElement>;

export function SidebarRoot({ collapsed = false, children, footer, isMobile = false, id: idProp, className, ...rest }: Props) {
  const id = idProp ?? 'dashboard-sidebar';
  return (
    <SidebarProvider collapsed={collapsed}>
      <aside
        id={id}
        data-collapsed={collapsed ? 'true' : 'false'}
        data-mobile={isMobile ? 'true' : 'false'}
        className={cn(
          // Full viewport height so footer can pin reliably.
          'flex h-dvh flex-col',
          // Sidebar base styles using tokens
          'min-h-0 border-r border-[var(--sb-border)]',
          'shadow-sm',
          'relative overflow-x-hidden',
          'bg-[var(--sb-bg)]',
          // Ensure sidebar creates a stacking context so footer avatar can't be
          // visually hijacked by overlayed content in the main area.
          'overflow-visible z-20',
          // Mobile drawer behavior: fixed overlay
          isMobile && collapsed && 'hidden',
          isMobile && !collapsed && 'fixed left-0 top-0 z-40 w-[min(var(--sb-width-expanded),92vw)] min-w-[min(var(--sb-width-expanded),92vw)] shadow-lg',
          // Desktop behavior: inline layout
          !isMobile && !collapsed && 'w-[var(--sb-width-expanded)] min-w-[var(--sb-width-expanded)]',
          !isMobile && collapsed && 'w-[var(--sb-width-collapsed)] min-w-[var(--sb-width-collapsed)]',
          className
        )}
        aria-label="Dashboard sidebar"
        {...rest}
      >
        <SidebarTooltipProvider>
          {/* Screen reader announcement for collapse/expand state */}
          <span aria-live="polite" aria-atomic="true" className="sr-only" data-testid="sr-announcer">
            {collapsed ? 'Sidebar collapsed' : 'Sidebar expanded'}
          </span>

          {/* Top bar injected by caller */}
          <nav 
            id="sidebar-nav" 
            className={cn(
              'flex-1 overflow-y-auto',
              'py-2 px-3' // Match nav padding: 0.5rem 0.75rem
            )} 
            aria-label="Primary"
          >
            {children}
          </nav>

          {/* Footer section - fixed at bottom with proper styling */}
          {footer && (
            <div className={cn(
              'min-h-14 flex items-center',
              'border-t border-[var(--sb-border)]',
              'bg-[var(--sb-footer-bg,var(--sb-bg))]',
              'p-0' // Padding handled by inner content
            )}>
              {footer}
            </div>
          )}
        </SidebarTooltipProvider>
      </aside>
    </SidebarProvider>
  );
}
