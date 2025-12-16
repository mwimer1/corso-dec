#!/usr/bin/env node
// The following rules are now enforced by ESLint and no longer need AST-Grep checks:
// - consolidated-no-server-import-in-edge-runtime.yml → corso/no-server-in-edge
// - consolidated-forbid-security-barrel-in-client-or-edge.yml → corso/forbid-security-barrel-in-client-or-edge
// - consolidated-no-server-reexports.yml → corso/no-server-reexports
// - consolidated-forbid-server-only-in-shared.yml → corso/no-server-only-directive-in-shared
console.log('[runtime-boundaries] All runtime boundary rules are now handled by ESLint.');
console.log('[runtime-boundaries] This script is deprecated and will exit successfully.');
console.log('[runtime-boundaries] Run "pnpm lint" to enforce these rules via ESLint.');

// Exit successfully - ESLint handles all enforcement now
process.exit(0);


