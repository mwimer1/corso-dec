---
title: "Monitoring"
description: "Core lib utilities and functionality for the Corso platform. Located in monitoring/."
last_updated: "2025-12-31"
category: "library"
status: "draft"
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `lib/monitoring`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Component Structure

### Core Monitoring Utilities
Located in `lib/monitoring/` (flattened from core subdirectory):

- **`base-logger.ts`**: Base logger implementation with shared formatter and logger factory (internal, used by logger implementations)
- **`logger.ts`**: Universal logger for Node.js and browser environments (uses AsyncLocalStorage when available)
- **`logger-edge.ts`**: Edge-safe logger for Edge runtime (no async_hooks, uses in-memory storage)
- **`metrics.ts`**: Basic metrics interface for application monitoring
- **`index.ts`**: Barrel export for client-safe monitoring utilities

### Architecture Notes
- Monitoring utilities follow a flattened structure (no nested subdirectories)
- `base-logger.ts` is internal implementation detail (not exported from barrel)
- `logger.ts` and `logger-edge.ts` are the public APIs (exported via barrel)
- All utilities are kept at the root level for easier maintenance
