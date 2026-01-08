---
title: "Forms"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "Form components and utilities for form handling and validation."
---
# Form Components

Form components and utilities for form handling and validation. Provides form primitives and contact form components.

## Overview

The `components/forms/` directory provides:
- **Form primitives**: Base field components and renderers
- **Contact forms**: Contact form components and hooks
- **Form utilities**: Form validation and state management

## Directory Structure

```
components/forms/
├── contact/              # Contact form components
│   ├── contact-form.tsx
│   └── use-contact-form.ts
├── primitives/          # Form primitives
│   ├── field-base.tsx
│   └── field-renderer.tsx
└── index.ts            # Barrel exports
```

## Usage

```typescript
import { ContactForm } from '@/components/forms/contact/contact-form';
import { FieldBase, FieldRenderer } from '@/components/forms/primitives';
```

## Related Documentation

- [Components Overview](../README.md) - Component directory overview
- [Marketing Components](../marketing/README.md) - Marketing components (includes contact forms)

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active

