---
title: "Widgets"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in landing/widgets/."
---
# Widgets

The widgets directory contains UI components for the Corso platform.

UI components for the components system, following atomic design principles. Located in landing/widgets/.

## Directory Structure

```
components/landing/widgets/
animated-number.tsx
animated-pill.tsx
animated-pill.module.css
chart.tsx
filter-pills.tsx
filter-select.tsx
number-input-with-steppers.tsx
pill-group.tsx
statistics.tsx
use-number-input.ts
year-range-slider.tsx
```

## Components

- **AnimatedPill** - Animated pill component with width clamping and spinning border effect (uses `animated-pill.module.css`)

## Usage

Import components from the appropriate subdirectory:

```typescript
import { ComponentName } from '@/components/landing/widgets/subdirectory';
```

