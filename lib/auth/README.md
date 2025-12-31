---
title: "Auth"
description: "Core lib utilities and functionality for the Corso platform. Located in auth/."
last_updated: "2025-12-31"
category: "library"
status: "draft"
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `lib/auth`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Component Structure

### Authentication & Authorization Utilities
Located in `lib/auth/`:

- **`server.ts`**: Server-only authentication utilities (deprecated `requireUserId`, use `auth()` from Clerk directly)
- **`client.ts`**: Client-safe authentication utilities barrel export
- **`clerk-appearance.ts`**: Edge-safe, client-safe Clerk appearance configuration
- **`roles.ts`**: Role-based access control utilities (`assertRole` function) - flattened from authorization subdirectory

### Architecture Notes
- All auth utilities follow a flattened structure (no nested subdirectories)
- Server-only code is clearly marked with `'server-only'` directive
- Client-safe utilities are exported through `client.ts` barrel
- Role authorization utilities are at the root level for easier maintenance
