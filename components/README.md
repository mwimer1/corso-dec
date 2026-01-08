---
title: "Components"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI component library following atomic design principles with domain grouping."
---
# Components Directory

Organized component library following atomic design principles combined with domain grouping. Components are organized by both design system hierarchy (atoms, molecules, organisms) and domain (dashboard, chat, marketing).

## Overview

The `components/` directory provides:
- **Design system primitives**: Atomic design components (`ui/atoms`, `ui/molecules`, `ui/organisms`)
- **Domain components**: Feature-specific components organized by domain

## Directory Structure

### Design System (`components/ui/`)

Design system primitives organized by atomic design:

- **`atoms/`** - Basic building blocks (Button, Input, Card, Icon, etc.)
- **`molecules/`** - Composed components (NavItem, PageHeader, SectionHeader, etc.)
- **`organisms/`** - Complex components (Navbar, Footer, SectionShell, FullWidthSection, etc.)

**Usage:**
```typescript
import { Button } from '@/components/ui/atoms/button';
import { Navbar } from '@/components/ui/organisms/navbar';
```

See [components/ui/README.md](ui/README.md) for design system documentation.

### Domain Components

#### `components/landing/`
**Homepage-specific components** used exclusively on the landing page (`/`).

**When to use**: Components that appear only on the homepage.
- Hero section
- Product Showcase
- ROI Calculator
- Market Insights

**Usage:**
```typescript
import { HeroSection } from '@/components/landing/sections/hero';
```

#### `components/marketing/`
**Marketing page components** used on marketing routes beyond the homepage.

**When to use**: Components for marketing pages like `/pricing`, `/contact`, `/legal/*`.
- Pricing sections
- Contact forms
- Legal page content

**Usage:**
```typescript
import { PricingSection } from '@/components/marketing/sections/pricing';
```

#### `components/dashboard/`
**Dashboard-specific components** for authenticated user interface.

**Components:**
- Entity grids (projects, companies, addresses)
- Dashboard layout and navigation
- Sidebar components

**Usage:**
```typescript
import { EntityGridHost } from '@/components/dashboard/entities';
import { DashboardLayout } from '@/components/dashboard/layout/dashboard-layout';
```

See [components/dashboard/README.md](dashboard/README.md) for dashboard components documentation.

#### `components/chat/`
**Chat interface components** for AI chat functionality.

**Components:**
- Chat window and composer
- Message components
- Chat widgets (table, welcome, follow-up chips)

**Usage:**
```typescript
import { ChatWindow } from '@/components/chat/sections/chat-window';
```

See [components/chat/README.md](chat/README.md) for chat components documentation.

#### Other Domain Directories

- **`components/auth/`** - Authentication-related components (sign-in, sign-up)
- **`components/forms/`** - Form components and utilities
- **`components/billing/`** - Billing and subscription components
- **`components/insights/`** - Insights/blog components

## Decision Tree: Landing vs Marketing vs UI

### Use `components/landing/` when:
- Component is used exclusively on the homepage (`/`)
- Component is homepage-specific (e.g., Hero, Product Showcase)

### Use `components/marketing/` when:
- Component is used on other marketing routes (`/pricing`, `/contact`, `/legal/*`)
- Component is reusable across multiple marketing pages

### Use `components/ui/` when:
- Component is a design system primitive
- Component is reusable across the entire application (not just marketing)

## Import Guidelines

### Barrel Imports (Outside Components)

When importing from outside the `components/` directory, you may use barrel imports:

```typescript
// ✅ Allowed outside components/
import { Button } from '@/components/ui/atoms/button';
import { EntityGridHost } from '@/components/dashboard/entities';
```

### Direct Imports (Inside Components)

When importing from within `components/`, use direct imports (barrels are forbidden):

```typescript
// ✅ Direct import within components/
import { Button } from '../ui/atoms/button';

// ❌ Barrel import forbidden within components/
import { Button } from '@/components/ui';
```

## Component Patterns

### Atomic Design Hierarchy

1. **Atoms**: Basic building blocks (Button, Input, Icon)
2. **Molecules**: Composed from atoms (FormField, NavItem, SectionHeader)
3. **Organisms**: Complex components from molecules (Navbar, Footer, SectionShell)

### Domain Grouping

Components are also organized by domain for feature-specific functionality:
- Dashboard components for authenticated user interface
- Chat components for AI chat functionality
- Marketing components for public-facing pages

## Styling

Components use:
- **Tailwind CSS**: Utility-first styling
- **CSS Modules**: Component-specific styles (where needed)
- **Design tokens**: Consistent spacing, colors, and typography

See [styles/README.md](../styles/README.md) for styling documentation.

## Testing

Component tests are located in `tests/components/` and `tests/ui/`.

**Run tests:**
```bash
pnpm test components/
pnpm test ui/
```

## Related Documentation

- [Component Design System](../.cursor/rules/component-design-system.mdc) - Component architecture and patterns
- [Dashboard Components](dashboard/README.md) - Dashboard component documentation
- [Chat Components](chat/README.md) - Chat component documentation
- [UI Components](ui/README.md) - Design system documentation
- [Styling Standards](../.cursor/rules/styling-standards.mdc) - CSS and styling guidelines

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active

