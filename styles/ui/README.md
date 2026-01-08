---
title: "Ui"
last_updated: "2026-01-07"
category: "styling"
status: "active"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/."
---
# Ui

The ui directory contains styling utilities, design tokens, and CSS patterns for the Corso platform.

Styling system for styles, using Tailwind CSS and design tokens. Located in ui/.

## Directory Structure

```
styles/ui/
atoms/          # Atomic design system components (Button, Input, Card, etc.)
molecules/      # Composite components (AuthCard, PricingCard, etc.)
organisms/      # Complex UI sections (Navbar, Footer, DashboardShell, etc.)
shared/         # Shared TypeScript variant utilities (typography-variants, container-base, etc.)
```

## Organization

- **atoms/**, **molecules/**, **organisms/**: TypeScript variant definitions following atomic design principles
- **shared/**: Reusable TypeScript styling utilities and variants (see [shared/README.md](./shared/README.md))

## Component-Specific CSS

For component-specific CSS patterns, use CSS modules colocated with components:

```typescript
// components/landing/widgets/animated-pill.tsx
import styles from './animated-pill.module.css';
```

This follows the established pattern where CSS modules (`.module.css`) are placed in the same directory as their components.

## Usage

Import variants and utilities as needed:

```typescript
// Atomic variants
import { buttonVariants } from '@/styles/ui/atoms/button-variants';

// Shared utilities
import { headingVariants } from '@/styles/ui/shared/typography-variants';

// CSS patterns are imported globally in globals.css
```

