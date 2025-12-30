import { containerMaxWidthVariants } from '@/styles/ui/shared/container-base';
import { tv } from '@/styles';

/**
 * dashboardShellVariants
 * ----------------------
 * Utility recipe for the <main> wrapper in DashboardLayout.
 */
const dashboardShellVariants = tv({
  base: 'flex-1 overflow-hidden transition-[margin] duration-300 ease-in-out bg-surface',
  variants: {
    /** Whether the left sidebar is collapsed or expanded */
    sidebar: {
      // Sidebar is a flex sibling; no additional left margin needed here
      expanded: '',
      collapsed: '',
    },
    /** Inner fixed-width container helper */
    maxWidth: {
      none: '',
      default: containerMaxWidthVariants({ maxWidth: 'dashboard', centered: true }),
    },
  },
  defaultVariants: {
    sidebar: 'expanded',
    maxWidth: 'default',
  },
});

export { dashboardShellVariants };


