---
title: "Dashboard"
last_updated: "2026-01-03"
category: "components"
status: "active"
description: "Dashboard components for business intelligence and data exploration. Located in dashboard/."
---
# Dashboard Components

Dashboard components for business intelligence, entity management, and data visualization.

## 📁 Structure

```
components/dashboard/
├── entities/            # Entity grid components (projects, companies, addresses)
├── layout/              # Dashboard layout components
└── sidebar/             # Dashboard sidebar navigation
```

## 🎨 Styling System

### Tailwind-First Approach
Dashboard components primarily use Tailwind utilities with design tokens:

- **No CSS modules**: Dashboard components use Tailwind classes exclusively
- **Design tokens**: All colors, spacing, and typography use tokens via Tailwind
- **Sidebar tokens**: Sidebar-specific tokens from `styles/tokens/sidebar.css`

### Token Usage
```tsx
// ✅ CORRECT: Use Tailwind with tokens
<div className="h-[var(--sb-item-h)] px-3 border border-[var(--sb-border)]">
  <span className="text-[var(--sb-ink)]">Item</span>
</div>

// ❌ INCORRECT: Hardcoded values
<div className="h-[44px] px-3 border border-gray-200">
  <span className="text-gray-800">Item</span>
</div>
```

### Sidebar Styling
Sidebar components use Tailwind utilities with sidebar-specific tokens:
- `--sb-width-expanded`: Sidebar expanded width
- `--sb-item-h`: Item height
- `--sb-border`: Border color
- `--sb-ink`: Text color
- See `styles/tokens/sidebar.css` for full token list

## 📚 Related Documentation

- [Dashboard UI Standards](../../docs/architecture-design/dashboard-ui-standards.md) - Dashboard-specific patterns
- [Styling Standards](../../.cursor/rules/styling-standards.mdc) - CSS module guidelines
- [Component Design System](../../.cursor/rules/component-design-system.mdc) - Component architecture

