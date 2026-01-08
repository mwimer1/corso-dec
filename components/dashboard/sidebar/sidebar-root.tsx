"use client";

import { cn } from '@/styles';
import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { SidebarProvider } from './sidebar-context';
import { SidebarTooltipProvider } from './sidebar-tooltip-layer';
import styles from './sidebar.module.css';

type Props = PropsWithChildren<{
  collapsed?: boolean; // controlled by composed layout
  footer?: ReactNode;
}> & HTMLAttributes<HTMLElement>;

export function SidebarRoot({ collapsed = false, children, footer, id: idProp, className, ...rest }: Props) {
  const id = idProp ?? 'dashboard-sidebar';
  return (
    <SidebarProvider collapsed={collapsed}>
      <aside
        id={id}
        data-collapsed={collapsed ? 'true' : 'false'}
        className={cn(
          // Full viewport height so footer can pin reliably.
          'sidebar-tokens',
          'sb-surface',
          // Access CSS module keys via bracket notation to satisfy strict typings
          styles['root'],
          'flex h-dvh flex-col',
          // Ensure sidebar creates a stacking context so footer avatar can't be
          // visually hijacked by overlayed content in the main area.
          'relative overflow-visible z-20',
          className,
          // add expanded helper class so CSS Modules can target expanded state
          !collapsed && styles['expanded']
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
          {/* <SidebarTop .../> */}
          <nav id="sidebar-nav" className={cn('sb-nav', 'sb-scroll', styles['nav'], 'flex-1 overflow-y-auto')} aria-label="Primary">
            {children}
          </nav>

          {/* Footer section - fixed at bottom with proper styling */}
          {footer && (
            <div className={cn(styles['footer'], 'sb-footer')}>
              {footer}
            </div>
          )}
        </SidebarTooltipProvider>
      </aside>
    </SidebarProvider>
  );
}
