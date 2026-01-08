---
title: "Auth"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "Authentication-related components for sign-in, sign-up, and Clerk integration."
---
# Auth Components

Authentication-related components for sign-in, sign-up, and Clerk integration. Provides layout components and Clerk-specific utilities.

## Overview

The `components/auth/` directory provides:
- **Auth layout**: Authentication page layouts and shells
- **Clerk integration**: Clerk script loading and event handling
- **Auth navigation**: Navigation components for auth pages

## Directory Structure

```
components/auth/
├── layout/                  # Auth layout components
│   ├── auth-navbar.tsx
│   ├── auth-shell.tsx
│   └── clerk-loading.tsx
├── widgets/                 # Clerk widgets
│   └── clerk-events-handler.tsx
├── clerk-script-loader.tsx  # Clerk script loading
└── index.ts                 # Barrel exports
```

## Usage

```typescript
import { AuthShell, AuthNavbar } from '@/components/auth';
import { ClerkScriptLoader } from '@/components/auth/clerk-script-loader';
```

## Related Documentation

- **Auth Routes**: `app/(auth)/README.md` - Authentication route documentation
- [Components Overview](../README.md) - Component directory overview
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Security patterns

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active

