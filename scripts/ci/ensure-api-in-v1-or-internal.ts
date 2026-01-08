#!/usr/bin/env ts-node
/** Enforces API route placement & runtime declarations.
 *  Rules:
 *    - All API route files must be under one of:
 *      /app/api/v1/**, /app/api/internal/**, or /app/api/health/**
 *    - Each route file must export a top-level `export const runtime = 'edge' | 'nodejs'`
 *  Rationale:
 *    - Versioning keeps breaking changes isolated under /v1
 *    - /internal hosts non-public operational endpoints, never exposed in OpenAPI client SDKs
 *    - /health hosts public health check endpoints (unversioned, documented in OpenAPI)
 *  If you need a throwaway dev endpoint, prefer local mocks or a dev-only route under /internal
 *  behind `NODE_ENV !== 'production'`.
 */
import { globby } from 'globby';
import { readFileSync } from 'node:fs';

async function main(): Promise<void> {
  const routes = await globby(['app/api/**/route.ts'], { gitignore: true });
  const errors: string[] = [];

  for (const file of routes) {
    // Allow health endpoints under /api/health/** (public, unversioned, documented in OpenAPI)
    // Allow versioned public endpoints under /api/v1/**
    // Allow internal endpoints under /api/internal/**
    if (!file.includes('/api/v1/') && !file.includes('/api/internal/') && !file.includes('/api/health/')) {
      errors.push(`${file}: API routes must live under /api/v1/**, /api/internal/**, or /api/health/**`);
    }
    const src = readFileSync(file, 'utf8');
    if (!/export\s+const\s+runtime\s*=\s*['"](edge|nodejs)['"]/m.test(src)) {
      errors.push(`${file}: missing export const runtime = 'edge'|'nodejs'`);
    }
  }

  if (errors.length) {
    console.error('verify:routes failed:\n' + errors.map(e => ` - ${e}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('verify:routes: OK');
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});



