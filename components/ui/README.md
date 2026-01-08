---
title: "UI Components"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "Design system components following atomic design principles."
---
# UI Components

Design system components following atomic design principles. Organized by hierarchy: atoms, molecules, organisms, and patterns.

## Overview

The `components/ui/` directory provides the foundational design system for the Corso platform:
- **Atoms**: Basic building blocks (Button, Input, Card, Icon, etc.)
- **Molecules**: Composed components (NavItem, PageHeader, SectionHeader, etc.)
- **Organisms**: Complex components (Navbar, Footer, SectionShell, FullWidthSection, etc.)

## Directory Structure

```
components/ui/
├── atoms/              # Basic building blocks
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── icon/
│   ├── input.tsx
│   ├── label.tsx
│   ├── link.tsx
│   ├── logo.tsx
│   ├── progress.tsx
│   ├── skeleton.tsx
│   └── ...
├── molecules/          # Composed components
│   ├── auth-card.tsx
│   ├── nav-item.tsx
│   ├── page-header.tsx
│   ├── pricing-card.tsx
│   └── ...
├── organisms/          # Complex components
│   ├── navbar/
│   ├── footer-system/
│   ├── section-shell.tsx
│   └── ...
└── shared/             # Shared UI utilities
```

## Usage

### Importing Components

```typescript
// Atoms
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';

// Molecules
import { NavItem } from '@/components/ui/molecules/nav-item';
import { PageHeader } from '@/components/ui/molecules/page-header';
import { SectionHeader } from '@/components/ui/molecules/section-header';

// Organisms
import { Navbar } from '@/components/ui/organisms/navbar';
import { FooterSystem } from '@/components/ui/organisms/footer-system';
import { SectionShell } from '@/components/ui/organisms/section-shell';
```

### Import Guidelines

**Outside `components/` directory**: You may use barrel imports:
```typescript
import { Button } from '@/components/ui/atoms/button';
```

**Inside `components/` directory**: Use direct imports (barrels are forbidden):
```typescript
import { Button } from '../ui/atoms/button';
```

## Atomic Design Hierarchy

1. **Atoms**: Basic HTML elements and primitives
2. **Molecules**: Simple combinations of atoms (e.g., SectionHeader, PageHeader)
3. **Organisms**: Complex components combining molecules (e.g., SectionShell, Navbar, Footer)

## Related Documentation

- [Component Design System](../../.cursor/rules/component-design-system.mdc) - Component architecture
- [Components Overview](../README.md) - Component directory overview
- [Styling Standards](../../.cursor/rules/styling-standards.mdc) - CSS and styling guidelines

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active

