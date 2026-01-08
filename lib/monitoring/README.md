---
title: "Monitoring"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Logging and metrics utilities for monitoring and observability."
---
# Monitoring

Logging and metrics utilities for monitoring and observability.

## Runtime

**Runtime**: universal ⚠️

*No runtime-specific signals detected (likely universal/isomorphic)*

**Signals detected:**
- No runtime signals detected

## Directory Structure

```
lib/monitoring/
├── base-logger.ts
├── index.ts
├── logger-edge.ts
├── logger.ts
├── metrics.ts
```

## Public API

**Value exports** from `@/lib/monitoring`:

- `logger`
- `metrics`
- `runWithEdgeRequestContext`
- `runWithRequestContext`

## Usage

```typescript
import { logger } from '@/lib/monitoring';
```

