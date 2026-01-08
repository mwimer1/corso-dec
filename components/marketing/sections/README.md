---
title: "Sections"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in marketing/sections/."
---
# Sections

The sections directory contains UI components for the Corso platform.

UI components for the components system, following atomic design principles. Located in marketing/sections/.

## Directory Structure

```
components/marketing/sections/
contact/
  contact/contact-form-wrapper.tsx
  contact/contact-info.tsx
  contact/contact-item.tsx
  contact/contact-layout.tsx
legal/
  legal/cookies-content.tsx
  legal/legal-content-wrapper.tsx
  legal/legal-page-section.tsx
  legal/legal-section.tsx
  legal/privacy-content.tsx
  legal/terms-content.tsx
pricing/
  pricing/plan-ui.ts
  pricing/pricing-faq.tsx
  pricing/pricing-header.tsx
  pricing/pricing-page.tsx
  pricing/types.ts
```

## Usage

Import components from the appropriate subdirectory:

```typescript
import { ComponentName } from '@/components/marketing/sections/subdirectory';
```

