// Canonical dashboard navigation surface
// Keep only the current API that has non-test consumers.
// Removed legacy types DashboardNavItem/DashboardNavConfigItem and NAV_CONFIG.

"use client";

import { Building2, FolderKanban, MapPin, MessageSquare } from "lucide-react";

export const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard/chat", label: "Chat", icon: <MessageSquare className="h-5 w-5" aria-hidden="true" />, roles: ['owner', 'admin', 'member', 'viewer'] as const },
  { href: "/dashboard/projects", label: "Projects", icon: <FolderKanban className="h-5 w-5" aria-hidden="true" />, roles: ['owner', 'admin', 'member'] as const },
  { href: "/dashboard/companies", label: "Companies", icon: <Building2 className="h-5 w-5" aria-hidden="true" />, roles: ['owner', 'admin', 'member'] as const },
  { href: "/dashboard/addresses", label: "Addresses", icon: <MapPin className="h-5 w-5" aria-hidden="true" />, roles: ['owner', 'admin', 'member'] as const },
] as const;

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Role hierarchy for permission checking.
 * Higher roles inherit permissions from lower roles.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  'service': 0,
  'viewer': 1,
  'member': 2,
  'admin': 3,
  'owner': 4,
};

/**
 * Checks if a role has sufficient permissions for an action.
 * Higher roles inherit permissions from lower roles.
 */
function hasRolePermission(
  userRole: 'owner' | 'admin' | 'member' | 'viewer' | 'service' | null | undefined,
  requiredRoles: readonly ('owner' | 'admin' | 'member' | 'viewer' | 'service')[]
): boolean {
  if (!userRole) return false;
  
  // Check if user's role is in the required roles list
  if (requiredRoles.includes(userRole)) return true;
  
  // Check if user's role is higher than any required role (inheritance)
  const userRoleLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const hasPermission = requiredRoles.some(role => {
    const requiredLevel = ROLE_HIERARCHY[role] ?? 0;
    return userRoleLevel >= requiredLevel;
  });
  
  return hasPermission;
}

/**
 * Filters DASHBOARD_NAV_ITEMS based on provided role and feature flag lookup.
 * 
 * @param args - Configuration object with optional role and feature flags
 * @returns Filtered array of navigation items available to the user
 * 
 * @example
 * ```ts
 * // Show only items available to admin
 * const items = getAvailableNavItems({ role: 'admin' });
 * 
 * // Show all items (no filtering)
 * const items = getAvailableNavItems();
 * ```
 */
export function getAvailableNavItems(args?: {
  role?: 'owner' | 'admin' | 'member' | 'viewer' | 'service' | null;
  features?: Record<string, boolean | undefined>;
}): typeof DASHBOARD_NAV_ITEMS {
  const { role, features: _features = {} } = args ?? {};
  
  // Feature flag check (currently all features enabled)
  const ffOk = true; // No feature flags currently used
  
  if (!ffOk) {
    return [] as unknown as typeof DASHBOARD_NAV_ITEMS;
  }
  
  // If no role provided, return all items (backward compatibility)
  if (!role) {
    return DASHBOARD_NAV_ITEMS;
  }
  
  // Filter items based on role permissions
  const filtered = DASHBOARD_NAV_ITEMS.filter(item => {
    const itemRoles = item.roles ?? ['owner', 'admin', 'member', 'viewer'];
    return hasRolePermission(role, itemRoles);
  });
  
  // Type assertion needed because filter may return fewer items
  return filtered as unknown as typeof DASHBOARD_NAV_ITEMS;
}

