---
title: "Security"
description: "Core lib utilities and functionality for the Corso platform. Located in security/."
last_updated: "2025-12-31"
category: "library"
status: "draft"
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `lib/security`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Component Structure

### Security Utilities
Located in `lib/security/`:

- **`masking.ts`**: Privacy-aware data masking utility for secure logging (`maskSensitiveData`) - flattened from utils subdirectory
- **`turnstile.server.ts`**: Cloudflare Turnstile verification utility (server-only)
- **`server.ts`**: Server-only barrel export (exports turnstile utilities)
- **`index.ts`**: Client-safe barrel export (exports masking utilities)

### Architecture Notes
- Security utilities follow a flattened structure (no nested subdirectories)
- Client-safe utilities (masking) are exported via `index.ts` barrel
- Server-only utilities (turnstile) are exported via `server.ts` barrel
- All utilities are kept at the root level for easier maintenance
