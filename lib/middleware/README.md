---
title: "Middleware"
description: "Core lib utilities and functionality for the Corso platform. Located in middleware/."
last_updated: "2025-12-31"
category: "library"
status: "draft"
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `lib/middleware`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Component Structure

### Runtime-Based Organization
The middleware directory is organized by runtime compatibility to ensure proper Edge/Node.js boundary separation:

- **`edge/`**: Edge runtime middleware wrappers (no Node.js dependencies)
  - `error-handler.ts` - Edge-safe error handling wrapper
  - `rate-limit.ts` - Edge-safe rate limiting wrapper

- **`shared/`**: Edge-safe utilities used by both Edge and Node.js runtimes
  - `cors.ts` - CORS header utilities
  - `headers.ts` - Header manipulation utilities
  - `request-id.ts` - Request ID generation and header management
  - `rate-limit.ts` - Node-only rate limiting for server actions (not route handlers)

- **`node/`**: Node.js-only middleware wrappers (require `server-only`)
  - `with-error-handling-node.ts` - Node.js error handling wrapper (uses AsyncLocalStorage)
  - `with-rate-limit-node.ts` - Node.js rate limiting wrapper (uses server-side store)

### Usage Patterns
- **Edge routes**: Import from `@/lib/middleware` barrel or `@/lib/api` (edge-safe exports)
- **Node.js routes**: Import from `@/lib/middleware` barrel for Node-only wrappers
- **Server actions**: Import `withRateLimit` from `@/lib/middleware/shared/rate-limit`
- **Direct imports**: Use when you need specific utilities (e.g., `@/lib/middleware/shared/cors`)
