---
title: "Landing"
last_updated: "2026-01-03"
category: "components"
status: "active"
description: "Landing page components for marketing and product showcase. Located in landing/."
---
# Landing Components

Landing page components for marketing sections, product showcases, and interactive calculators.

## 📁 Structure

```
components/landing/
├── sections/          # Main landing page sections
│   ├── hero/            # Hero section with animated pill
│   ├── market-insights/ # Market insights with charts
│   ├── product-showcase/# Product showcase tabs
│   ├── roi/             # ROI calculator
│   └── use-cases/       # Use case explorer
├── widgets/             # Reusable landing widgets
│   ├── animated-pill.tsx
│   ├── chart.tsx
│   ├── filter-pills.tsx
│   └── statistics.tsx
├── layout/              # Layout components
│   └── landing-section.tsx
└── utils/               # Landing-specific utilities
    └── data.ts
```

## 🎨 Styling System

### CSS Modules
Landing sections use CSS modules for complex responsive styling:

- **Hero** (`hero.module.css`): Complex responsive min-height calculations with `clamp()`
- **Market Insights** (`market-insights.module.css`): Minimal positioning utilities
- **ROI Calculator** (`roi.module.css`): Complex number input stepper styling with animations

### Design Tokens
All CSS modules use design tokens for:
- **Spacing**: `var(--space-*)` tokens (sm, md, lg, xl, etc.)
- **Colors**: `hsl(var(--*))` semantic color tokens
- **Radius**: `var(--radius-*)` tokens (sm, md, lg, xl, 2xl)
- **Domain tokens**: Hero-specific tokens from `styles/tokens/hero.css`

### Import Pattern
```tsx
import styles from './hero.module.css';

<div className={styles['hero']}>
  <h1 className={styles['title']}>Title</h1>
</div>
```

## 📚 Related Documentation

- [Styling Standards](../../.cursor/rules/styling-standards.mdc) - CSS module guidelines
- [Component Design System](../../.cursor/rules/component-design-system.mdc) - Component architecture

