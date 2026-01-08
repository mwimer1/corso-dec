---
title: "Security"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Security utilities for data masking, prompt injection prevention, and bot verification."
---
# Security

Security utilities for data masking, prompt injection prevention, and bot verification.

## Runtime

**Runtime**: universal ⚠️

*No runtime-specific signals detected (likely universal/isomorphic)*

**Signals detected:**
- No runtime signals detected

## Directory Structure

```
lib/security/
├── index.ts
├── masking.ts
├── prompt-injection.ts
├── server.ts
└── turnstile.server.ts
```

## Public API

**Value exports** from `@/lib/security`:

- `maskSensitiveData`

## Usage

```typescript
import { maskSensitiveData } from '@/lib/security';
```

