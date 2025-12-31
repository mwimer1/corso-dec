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
 * - Accent: Primary brand blue - used for icons, active states, selections
 * - Foreground: Standard text color from design tokens
 * - Background: Surface token for consistent backgrounds
 * - Border: Design system border color token
 * 
 * Theme params are implemented as --ag-* CSS custom properties and can be
 * overridden in CSS for density modes or other customizations.
 */
export const corsoAgGridTheme = themeQuartz.withParams({
  // Colors - use design system tokens for consistency and dark mode support
  accentColor: "hsl(var(--primary, 221 86% 54%))", // Brand blue from design tokens
  backgroundColor: "hsl(var(--surface, 0 0% 100%))", // Surface token for backgrounds
  borderColor: "hsl(var(--border, 214.3 31.8% 89%))", // Border color from design tokens
  foregroundColor: "hsl(var(--foreground))", // Foreground text color from design tokens
  
  // Typography - use app font (Inter via --font-sans)
  fontFamily: "var(--font-sans, inter, system-ui, sans-serif)",
  fontSize: 13,
  headerFontSize: 13,
  headerFontWeight: 400,
  headerTextColor: "hsl(var(--text-medium, 240 5% 25%))", // Medium gray for headers from text hierarchy tokens
  
  // Spacing and layout
  spacing: 6, // Maps to --ag-spacing (replaces legacy --ag-grid-size)
  borderRadius: 2,
  // Use integer-safe padding calculation to avoid fractional pixels that cause blur
  // With spacing=6 => 9px (comfortable), spacing=4 => 6px (compact) - both whole pixels
  cellHorizontalPadding: { calc: '1.5 * spacing' },
  // Removed rowVerticalPaddingScale: rowHeight is explicitly set in grid options,
  // so this scale has no effect and was misleading
  
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
  
  // Selection and hover colors - use tokens with opacity for consistency
  selectedRowBackgroundColor: "hsl(var(--primary, 221 86% 54%) / 0.08)", // Accent color at 8% opacity
  rowHoverColor: "hsl(var(--foreground, 222.2 47.4% 11.2%) / 0.03)", // Foreground at 3% opacity for subtle hover
});

