---
title: "Market Insights"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in landing/sections/market-insights/."
---
# Market Insights

The market-insights directory contains UI components for the Corso platform.

UI components for the components system, following atomic design principles. Located in landing/sections/market-insights/.

## Directory Structure

```
components/landing/sections/market-insights/
chart-data.ts
market-insights-lazy.tsx
market-insights-section.tsx
```

## Usage

Import components from the appropriate subdirectory:

```typescript
import { MarketInsightsSection } from '@/components/landing/sections/market-insights/market-insights-section';
```

### Props

- **`withContainer?: boolean`** - Whether to apply internal container wrapper (default: `true`). Set to `false` when used inside a `FullWidthSection` with container props to avoid double containers.

