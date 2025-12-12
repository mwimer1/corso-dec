"use client";

import { cn } from '@/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useSidebar } from './sidebar-context';
import { SidebarTooltip } from './sidebar-tooltip';
import styles from './sidebar.module.css';

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
        <span className={cn(styles['icon'], 'flex items-center justify-center flex-shrink-0', collapsed && 'mx-auto')}>
          {/* icon sizing controlled by CSS module tokens */}
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
    styles['item'],
    active && styles['itemActive'],
    'flex items-center',
    collapsed ? 'justify-center px-0' : undefined,
    'h-12 rounded-lg transition-all duration-150',
    'hover:bg-black/5',
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
