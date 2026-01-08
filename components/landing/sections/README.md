---
description: "UI components for the components system, following atomic design principles. Located in landing/sections/."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Sections

The sections directory contains UI components for the Corso platform.

UI components for the components system, following atomic design principles. Located in landing/sections/.

## Directory Structure

```
components/landing/sections/
hero/
  hero/hero.tsx
market-insights/
  market-insights/chart-data.ts
  market-insights/market-insights-lazy.tsx
  market-insights/market-insights-section.tsx
product-showcase/
  product-showcase/product-showcase.tsx
  product-showcase/tab-switcher.tsx
  product-showcase/tab-switcher.variants.ts
roi/
  roi/roi-calculator.tsx
  roi/roi-label-tooltip.tsx
  roi/roi-output-panel.tsx
use-cases/
  use-cases/industry-preview.tsx
  use-cases/industry-selector-panel.tsx
  use-cases/types.ts
  use-cases/use-case-card.tsx
  use-cases/use-case-explorer.tsx
  use-cases/use-case-preview-pane.tsx
  use-cases/use-cases.data.ts
```

## Usage

Import components from the appropriate subdirectory:

```typescript
import { ComponentName } from '@/components/landing/sections/subdirectory';
```

