// components/ui/molecules/tab-switcher/tab-button-base.tsx
// Shared utilities for tab-switcher button styling
export const getTabButtonClass = (active: boolean) =>
  [
    // Align typography with NavItem text variant: medium size, visible color, and strong weight when active
    // NavItem `text` variant uses `text-sm` with visible `text-foreground` and `font-medium`/`font-semibold` when active.
    'inline-flex items-center gap-2 px-3 py-2 text-sm text-foreground',
    // Match nav behavior: active tabs use stronger weight; inactive should still be fully readable (no low opacity)
    active ? 'font-semibold' : 'font-medium',
  ].join(' ');



