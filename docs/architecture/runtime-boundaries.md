---
title: "Architecture"
description: "Documentation and resources for documentation functionality. Located in architecture/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# Runtime Boundaries

- Do **not** re-export server-only modules from client/shared barrels. Use a dedicated `index.server.ts` barrel for server-only exports.
- Route files MUST declare `export const runtime = 'edge' | 'nodejs'`.
  - If any import from `@/lib/server/**` exists, use `'nodejs'` and ensure `import 'server-only'` exists in those modules.
- `@/lib/server/env` is the only allowed entry for server env. Never import `lib/shared/env/*`.
- ESLint rules (migrated from AST-Grep) enforce these patterns via `@/eslint-plugin-corso`.
- Remaining AST-Grep rules (~4 files) handle specialized patterns in `scripts/rules/ast-grep/`.
