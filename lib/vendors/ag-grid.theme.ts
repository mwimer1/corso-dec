'use client';

/**
 * Centralized AG Grid theme configuration for Corso.
 * 
 * AG Grid theme is centralized in corsoAgGridTheme and CSS overrides are scoped to .corso-ag-grid.
 * This provides a clear migration path for dark mode / variants later.
 */
import { themeQuartz } from 'ag-grid-community';

/**
 * Corso's AG Grid theme, based on Quartz.
 * 
 * Keep params minimal at first to mirror current look.
 * Can be expanded later once Tailwind/CSS tokens are mapped.
 */
export const corsoAgGridTheme = themeQuartz.withParams({
  // Start empty or minimal; only add parameters that you want centralized.
  // Example (optional, for future expansion):
  // spacing: 8,
  // accentColor: "var(--corso-accent)",
});

