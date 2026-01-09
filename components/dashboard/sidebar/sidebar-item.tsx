"use client";

import { cn } from '@/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useSidebar } from './sidebar-context';
import { SidebarTooltip } from './sidebar-tooltip';

type SidebarItemProps = {
  href?: string;
  label: string;
  icon?: ReactNode;
  isActive?: boolean; // allow override for exactness
  onClick?: () => void;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'>;

export function SidebarItem({ href, label, icon, isActive, className, onClick, ...rest }: SidebarItemProps) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const active = isActive ?? (href && (pathname === href || pathname.startsWith(href + '/')));

  const content = (
    <>
      {icon && (
        <span className={cn(
          'icon', // Add class for targeting
          'inline-flex items-center justify-center flex-shrink-0',
          'w-[var(--sb-icon-size,1.25rem)] h-[var(--sb-icon-size,1.25rem)]',
          '[&_svg]:w-full [&_svg]:h-full',
          collapsed && 'mx-auto',
          // Active icon styling
          active && 'text-[var(--sb-icon-active)]',
          active && '[&_svg]:stroke-[var(--sb-icon-active)]',
          active && '[&_svg]:fill-none',
          active && '[&_path]:stroke-[var(--sb-icon-active)]',
          active && '[&_path]:fill-none'
        )}>
          {icon}
        </span>
      )}
      {!collapsed && (
        <span className="ml-4 truncate flex-1 min-w-0">
          {label}
        </span>
      )}
    </>
  );

  const itemClasses = cn(
    // Base item styles using tokens
    'h-[var(--sb-item-h)] rounded-[var(--sb-radius)]',
    'text-[var(--sb-ink)]',
    'flex items-center',
    'mb-1', // margin-bottom: 0.25rem
    'transition-all duration-150',
    // Padding: collapsed vs expanded (consistent 12px horizontal padding)
    collapsed ? 'justify-center px-3' : 'px-3', // 0.75rem = 3 (12px)
    // Hover state
    'hover:bg-black/5',
    // Active state - use primary color at 10% opacity
    active && 'bg-primary/10',
    active && 'text-[var(--sb-ink-active)]',
    active && 'border-l-[3px] border-[var(--sb-ink-active)]',
    active && (collapsed ? 'pl-3' : 'pl-[calc(0.75rem-3px)]'), // Adjust for border (not used in collapsed state)
    // Remove border in collapsed state
    collapsed && active && 'border-l-0',
    // Focus states
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    className
  );

    if (!href) {
    return (
      <div
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? label : undefined}
        data-active={active ? 'true' : 'false'}
        data-collapsed={collapsed ? 'true' : 'false'}
        className={itemClasses}
          onClick={onClick}
          {...(rest as React.ComponentPropsWithoutRef<'div'>)}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href as string}
      className={itemClasses}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      data-active={active ? 'true' : 'false'}
      data-collapsed={collapsed ? 'true' : 'false'}
      onClick={onClick}
      {...(rest as any)}
    >
      {collapsed ? (
        <SidebarTooltip label={label} side="right">
          {content}
        </SidebarTooltip>
      ) : (
        content
      )}
    </Link>
  );
}
