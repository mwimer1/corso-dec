// styles/ui/shared/focus-ring.ts
// Helper to provide a consistent focus ring across interactive elements.

/** @public — shared focus state utility */
export function focusRing(color: 'primary' | 'danger' | 'success' | 'warning' = 'primary') {
  const colorClass =
    color === 'danger'
      ? 'focus-visible:ring-[hsl(var(--danger))]'
      : color === 'success'
        ? 'focus-visible:ring-[hsl(var(--success))]'
        : color === 'warning'
          ? 'focus-visible:ring-[hsl(var(--warning))]'
          : 'focus-visible:ring-[hsl(var(--ring))]';

  return [
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',
    colorClass,
  ].join(' ');
}



