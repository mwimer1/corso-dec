---
title: "Marketing"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "Marketing page components for pricing, contact, legal, and other marketing routes."
---
# Marketing Components

Marketing page components for pricing, contact, legal, and other marketing routes beyond the homepage.

## Overview

The `components/marketing/` directory provides:
- **Pricing sections**: Pricing plans, billing toggles, FAQ sections
- **Contact forms**: Contact form components and information displays
- **Legal pages**: Terms, privacy, cookies, and legal content components
- **Marketing widgets**: Reusable marketing widgets (animated icons, FAQ frames)

## Directory Structure

```
components/marketing/
├── layout/              # Marketing layout components
│   └── marketing-container.tsx
├── sections/           # Marketing page sections
│   ├── contact/        # Contact form components
│   ├── legal/          # Legal page components
│   ├── pricing/        # Pricing page components
│   └── README.md
├── widgets/            # Marketing widgets
│   ├── animated-lightning-icon.tsx
│   └── faq-section-frame.tsx
└── index.ts            # Barrel exports
```

## Usage

```typescript
import { PricingPage, ContactFormWrapper, LegalPageSection } from '@/components/marketing';
```

## Related Documentation

- [Components Overview](../README.md) - Component directory overview
- [Landing Components](../landing/README.md) - Homepage components
- **Marketing Routes**: `app/(marketing)/README.md` - Marketing route documentation

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active

