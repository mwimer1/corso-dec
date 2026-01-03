---
status: "active"
last_updated: "2026-01-03"
category: "documentation"
title: "Architecture Design"
description: "Documentation and resources for documentation functionality. Located in architecture-design/."
---
# Dashboard UI Standards

This document provides actionable guidelines for maintaining consistent, polished UI in the Corso dashboard. Follow these standards to ensure all dashboard work maintains the "venture-backed SaaS" aesthetic.

## 🎨 Typography

### Font Family
- **Primary font**: Inter (via `--font-sans` token)
- **Weights available**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **No synthetic weights**: Inter supports real 500/600 weights, so avoid font-weight hacks

### Font Sizes & Hierarchy
- **Page titles**: `text-2xl font-semibold` (24px, 600 weight)
- **Section headers**: `text-lg font-medium` (18px, 500 weight)
- **Body text**: `text-sm` or `text-base` (14px or 16px)
- **Muted text**: `text-muted-foreground` for secondary information
- **Subdued text**: Use `text-low` token for low-contrast text

### Font Rendering
- Font smoothing is applied globally via `styles/globals.css`:
  - `-webkit-font-smoothing: antialiased`
  - `-moz-osx-font-smoothing: grayscale`
  - `text-rendering: optimizelegibility`

## 🎯 Sidebar Standards

### Spacing & Layout
- **Item height**: `h-[var(--sb-item-h)]` (44px via token)
- **Item padding**: `px-3` when expanded, `px-2` when collapsed
- **Item gap**: `mb-1` (4px margin-bottom) between items
- **Border radius**: `rounded-[var(--sb-radius)]` (0.5rem via token)

### Active States
- **Active background**: `bg-[hsl(var(--primary,221_86%_54%)/0.1)]` (primary color at 10% opacity)
- **Active text**: `text-[var(--sb-ink-active)]`
- **Active border**: `border-l-[3px] border-[var(--sb-ink-active)]` (left border indicator)
- **Active icon**: Uses `--sb-icon-active` token for icon color

### Hover States
- **Hover background**: `hover:bg-black/5` (subtle 5% opacity)
- **Transitions**: `transition-all duration-150` for smooth state changes

### Collapsed State
- Items center-align when collapsed (`justify-center`)
- Active border removed in collapsed state
- Tooltips appear on hover (via `SidebarTooltip` component)

### Token Usage
- All sidebar colors use `--sb-*` tokens from `styles/tokens/sidebar.css`
- Never hardcode sidebar colors; always reference tokens

## 📊 Table (AG Grid) Standards

### Base CSS Requirements
- **Required imports** (in `app/layout.tsx`):
  1. `ag-grid-community/styles/ag-grid.css` (base structural CSS)
  2. `ag-grid-community/styles/ag-theme-quartz.css` (theme base CSS)
  3. `@/styles/ui/ag-grid.theme.css` (Corso custom overrides)

### Theme Configuration
- **Theme source**: `lib/vendors/ag-grid.theme.ts` (uses `themeQuartz.withParams`)
- **CSS overrides**: `styles/ui/ag-grid.theme.css` (selection column, density modes)
- **Font**: Uses `var(--font-sans)` to match app font family

### Visual Hierarchy
- **Header background**: Subtle separation via `hsl(var(--surface))` and `border-bottom`
- **Row borders**: Horizontal separators only (`rowBorder: true`, `columnBorder: false`)
- **Hover state**: `hsl(var(--foreground) / 0.03)` (foreground at 3% opacity)
- **Selected state**: `hsl(var(--primary) / 0.08)` (primary at 8% opacity)
- **Focus ring**: `hsl(var(--ring))` with 2px outline

### Spacing & Density
- **Comfortable mode**: `--ag-spacing: 6px`, `--ag-font-size: 13px`
- **Compact mode**: `--ag-spacing: 4px`, `--ag-font-size: 12px`
- **Row height**: Set via grid options (typically 40-44px)
- **Header height**: Set via grid options (typically 40-44px)

### Token Compliance
- All colors use design tokens: `hsl(var(--primary))`, `hsl(var(--border))`, etc.
- No hardcoded hex values in theme configuration
- Header text uses `hsl(var(--text-medium))` for proper hierarchy

## 🛠️ Toolbar & Header Standards

### Page Headers
- **Container**: `px-6 py-4 border-b border-border bg-background`
- **Title**: `text-2xl font-semibold text-foreground`
- **Spacing**: Consistent horizontal padding (`px-6`) aligns with content

### Toolbar Layout
- **Container**: `h-14 px-4 border-b border-border bg-background`
- **Left side**: Saved Searches dropdown, Tools dropdown, Search input
- **Right side**: Results count, action buttons (grouped), save actions
- **Spacing**: `gap-4` between major groups, `gap-1` within button groups

### Search Input
- **Width**: `w-72` (288px) for prominence
- **Icon**: Search icon on left, clear button on right when active
- **Keyboard shortcut**: Ctrl/Cmd+K to focus

### Action Buttons
- **Size**: `h-9 w-9` (36px square) for icon buttons
- **Hover**: `hover:bg-black/5` with `transition-colors`
- **Active**: `active:bg-black/10` for pressed state
- **Focus**: `focus-visible:ring-2 focus-visible:ring-ring` with offset
- **Grouping**: Visual separators between groups (`border-l border-border`)

## 🎨 Token Usage Rules

### Color Tokens
- **Never hardcode colors**: Use `hsl(var(--token))` pattern
- **Common tokens**:
  - `--primary`: Brand blue for accents, active states
  - `--foreground`: Primary text color
  - `--text-medium`: Medium-contrast text for headers
  - `--border`: Standard border color
  - `--ring`: Focus ring color
  - `--surface`: Background surfaces

### Spacing Tokens
- Use Tailwind spacing scale: `px-3`, `py-2`, `gap-4`, etc.
- For custom spacing, use spacing tokens: `var(--space-md)`

### Typography Tokens
- Font sizes: `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Font weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- Line heights: `leading-4`, `leading-5`, `leading-6`

## ✅ Quality Checklist

Before submitting dashboard UI changes, ensure:

- [ ] No hardcoded colors (hex values, rgba without tokens)
- [ ] All spacing uses Tailwind utilities or tokens
- [ ] Font weights are real (400, 500, 600, 700) - no synthetic weights
- [ ] Focus states visible for keyboard navigation
- [ ] Hover states provide clear feedback
- [ ] Active states use token-based colors
- [ ] AG Grid base CSS imported (if using tables)
- [ ] Sidebar uses Tailwind utilities (not CSS modules)
- [ ] All validation passes: `pnpm check:tokens`, `pnpm check:route-themes`, `pnpm lint`

## 🚫 Anti-Patterns

### ❌ Don't Do This
```tsx
// Hardcoded colors
<div className="bg-[#2563EB] text-[#1A1F2E]">

// Synthetic font weights
<span className="font-[500]"> // Lato doesn't have 500

// Sidebar styles migrated to Tailwind utilities with CSS tokens
// See styles/tokens/sidebar.css for sidebar design tokens

// Missing focus states
<button onClick={handleClick}>Action</button>
```

### ✅ Do This Instead
```tsx
// Token-based colors
<div className="bg-primary text-foreground">

// Real font weights (Inter supports 500)
<span className="font-medium">

// Tailwind utilities
<div className="flex items-center gap-3 px-3 py-2">

// Proper focus states
<button 
  onClick={handleClick}
  className="focus-visible:ring-2 focus-visible:ring-ring"
>
  Action
</button>
```

## 📚 Related Documentation

- [UI Design Guide](./ui-design-guide.md) - General UI principles
- [Table Documentation](../ui/table.md) - AG Grid implementation details
- [Entity Grid Architecture](../../.cursor/rules/entity-grid-architecture.mdc) - Grid architecture patterns
- [Component Design System](../../.cursor/rules/component-design-system.mdc) - Component standards

## 🔄 Maintenance

This document should be updated when:
- New dashboard UI patterns are established
- Token system changes
- Design system evolves
- New components are added to the dashboard

Last updated: 2025-01-29
