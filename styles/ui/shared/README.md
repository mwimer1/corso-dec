---
title: "Shared"
last_updated: "2026-01-07"
category: "styling"
status: "active"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/shared/."
---
# Shared

The shared directory contains TypeScript styling utilities and variant definitions for the Corso platform.

All files in this directory are TypeScript variant utilities that can be imported and used across components. For component-specific CSS patterns, use CSS modules colocated with components.

## Directory Structure

```
styles/ui/shared/
container-base.ts
container-helpers.ts
focus-ring.ts
index.ts
navbar-sizes.ts
surface-interactive.ts
typography-variants.ts
underline-accent.ts
```

## Usage

Import shared variants and utilities:

```typescript
import { containerVariants } from '@/styles/ui/shared/container-base';
import { headingVariants } from '@/styles/ui/shared/typography-variants';
```

