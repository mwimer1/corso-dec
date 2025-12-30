'use client';

/**
 * Centralized AG Grid theme configuration for Corso.
 * 
 * Uses AG Grid's Theming API (themeQuartz.withParams) for consistent styling
 * across all entity grids. CSS overrides in styles/ui/ag-grid.theme.css handle
 * custom selection column styling and density mode adjustments.
 * 
 * Design tokens are used via CSS variables to maintain consistency with the
 * rest of the Corso design system and enable future dark mode support.
 */
import { themeQuartz } from 'ag-grid-community';

/**
 * Corso's AG Grid theme, based on Quartz with custom parameters.
 * 
 * Colors use design system tokens (hsl(var(--token))) for consistency:
 * - Accent: #2563EB (footer CTA blue) - used for icons, active states, selections
 * - Foreground: #1A1F2E (standard text color)
 * - Background: #FFFFFF (white)
 * - Border: #D7E2E6 (matches design system border color)
 * 
 * Theme params are implemented as --ag-* CSS custom properties and can be
 * overridden in CSS for density modes or other customizations.
 */
export const corsoAgGridTheme = themeQuartz.withParams({
  // Colors - use design system tokens for consistency and dark mode support
  accentColor: "#2563EB", // Footer CTA blue
  backgroundColor: "hsl(var(--surface, 0 0% 100%))", // White, falls back to design token
  borderColor: "#D7E2E6", // Design system border color
  foregroundColor: "hsl(var(--foreground))", // #1A1F2E via design token
  
  // Typography - use app font (Lato via --font-sans)
  fontFamily: "var(--font-sans, lato, system-ui, sans-serif)",
  fontSize: 13,
  headerFontSize: 13,
  headerFontWeight: 400,
  headerTextColor: "#84868B", // Medium gray for headers
  
  // Spacing and layout
  spacing: 6, // Maps to --ag-spacing (replaces legacy --ag-grid-size)
  borderRadius: 2,
  cellHorizontalPaddingScale: 0.7,
  rowVerticalPaddingScale: 0.8,
  
  // Borders
  columnBorder: false, // No vertical borders in body cells
  headerColumnBorder: false, // No vertical borders in headers
  pinnedColumnBorder: false, // No border between pinned and unpinned columns (replaces CSS hack)
  rowBorder: true, // Horizontal row borders
  wrapperBorder: false,
  wrapperBorderRadius: 2,
  
  // Side panel
  sidePanelBorder: true,
  
  // Chrome (toolbar/status bar)
  chromeBackgroundColor: {
    ref: "backgroundColor" // Inherit from backgroundColor
  },
  
  // Browser color scheme
  browserColorScheme: "light",
  
  // Selection and hover colors - explicitly set for consistency
  selectedRowBackgroundColor: "rgba(37, 99, 235, 0.08)", // Accent color at 8% opacity
  rowHoverColor: "rgba(26, 31, 46, 0.03)", // Dark foreground at 3% opacity
});

