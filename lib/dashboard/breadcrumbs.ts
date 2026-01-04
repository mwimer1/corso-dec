// lib/dashboard/breadcrumbs.ts
// Breadcrumb utilities for dashboard pages

import type { BreadcrumbItem } from '@/types/shared';

/**
 * Get breadcrumb trail for a given dashboard pathname.
 * Returns empty array if no breadcrumbs should be shown.
 * 
 * For entity pages (Projects/Companies/Addresses), includes "Corso" root crumb
 * that links to a fresh chat thread.
 * 
 * Note: Used in server components (entity pages) - eslint may not detect usage.
 */
// eslint-disable-next-line import/no-unused-modules
export function getDashboardBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Static mapping with "Corso" root crumb for entity pages
  const routes: Record<string, BreadcrumbItem[]> = {
    '/dashboard/projects': [
      { label: 'Corso', href: '/dashboard/chat?new=true' },
    ],
    '/dashboard/companies': [
      { label: 'Corso', href: '/dashboard/chat?new=true' },
    ],
    '/dashboard/addresses': [
      { label: 'Corso', href: '/dashboard/chat?new=true' },
    ],
    '/dashboard/chat': [], // Chat page has no breadcrumbs (it's the root)
    // Future nested routes can be added here:
    // '/dashboard/projects/[id]': [
    //   { label: 'Corso', href: '/dashboard/chat?new=true' },
    //   { label: 'Projects', href: '/dashboard/projects' },
    // ],
  };

  return routes[pathname] ?? [];
}

/**
 * Get the current page label for a given dashboard pathname.
 * Utility function for consistent page labeling across dashboard routes.
 */
// eslint-disable-next-line import/no-unused-modules
export function getDashboardCurrentPageLabel(pathname: string): string {
  const labels: Record<string, string> = {
    '/dashboard/projects': 'Projects',
    '/dashboard/companies': 'Companies',
    '/dashboard/addresses': 'Addresses',
    '/dashboard/chat': 'Chat',
  };

  return labels[pathname] ?? 'Dashboard';
}
