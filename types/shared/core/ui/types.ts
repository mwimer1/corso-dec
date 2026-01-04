// types/shared/core/ui.types.ts
// Core UI interface types used across components

export interface NavItemData {
  href: string;
  label: string;
  external?: boolean;
}

/**
 * Breadcrumb item for navigation trails.
 * Used in dashboard and insights pages.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}


