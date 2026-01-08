---
title: "Organisms"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "UI components for the components system, following atomic design principles. Located in ui/organisms/."
---
# Organisms

The organisms directory contains UI components for the Corso platform.

UI components for the components system, following atomic design principles. Located in ui/organisms/.

## Directory Structure

```
components/ui/organisms/
app-error-boundary.tsx
error-fallback.tsx
faq.tsx
footer-system/
  footer-system/footer-cta.tsx
  footer-system/footer-legal.tsx
  footer-system/footer-main.tsx
  footer-system/footer.tsx
full-width-section.tsx
index.ts
navbar/
  navbar/links.ts
  navbar/navbar-menu.tsx
  navbar/navbar.tsx
  navbar/shared.tsx
public-layout.tsx
result-panel.tsx
site-footer-shell.tsx
```

## Usage

Import components from the appropriate subdirectory:

```typescript
import { ComponentName } from '@/components/ui/organisms/subdirectory';
```

