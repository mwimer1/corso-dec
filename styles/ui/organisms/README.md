---
title: "Organisms"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/organisms/."
last_updated: "2025-12-30"
category: "styling"
status: "draft"
---
# Organisms

Organism-level styles define high-level component variants for complex widgets, entire sections, or complete UI patterns. These represent the most sophisticated styling units that combine multiple molecules and atoms into full-featured components.

## Overview

Organisms are the highest-level styling units in the design system. They define styles for complex components that may include multiple sub-components, entire page sections, or complete interactive widgets. These variants often combine multiple variant dimensions and may use shared utilities from `styles/ui/shared/` for consistency.

## Variant Files

- **`account-menu.ts`** – User account menu component wrapper (integrates with third-party components)
- **`alert-dialog.ts`** – Alert dialog component with variant and size options
- **`contact-form.ts`** – Contact form container and field styling variants
- **`dashboard-shell.ts`** – Main dashboard layout shell with sidebar state and container max-width variants
- **`faq.ts`** – FAQ section component with question/answer styling using shared text size scale
- **`file-upload.ts`** – File upload component with state variants using shared rounded variants
- **`footer-cta-variants.ts`** – Footer call-to-action section variants
- **`footer-variants.ts`** – Site footer component with layout and variant options
- **`full-width-section.ts`** – Full-width page section with container and padding variants
- **`navbar.ts`** – Main navigation bar component variants
- **`navbar-layout.ts`** – Navigation bar layout container with responsive variants
- **`navbar-variants.ts`** – Navigation bar styling variants with theme and size options
- **`result-panel.ts`** – Result display panel component variants

## Usage

Organisms are used in high-level page components and complex widgets:

```tsx
import { dashboardShellVariants } from '@/styles/ui/organisms/dashboard-shell';

function DashboardLayout({ sidebarState, children }) {
  return (
    <main className={dashboardShellVariants({ sidebar: sidebarState, maxWidth: 'default' })}>
      {children}
    </main>
  );
}
```

## Patterns

- **Complex compositions**: Organisms often combine multiple variant dimensions (layout, size, theme, state)
- **Shared utilities**: Frequently use shared utilities from `styles/ui/shared/` (e.g., `containerMaxWidthVariants`, `containerWithPaddingVariants`)
- **Section-level styling**: Many organisms define styles for entire page sections or major UI regions
- **Third-party integration**: Some organisms (like `account-menu.ts`) wrap third-party components and provide consistent styling interfaces
