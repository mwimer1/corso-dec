#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

try {
  if (!existsSync('api')) mkdirSync('api', { recursive: true });
  // Fetch base spec from origin/main
  execSync('git fetch origin main --quiet', { stdio: 'inherit' });
  execSync('git show origin/main:api/openapi.json > api/openapi.base.json', { stdio: 'inherit', shell: true });

  // Run oasdiff breaking-change check
  execSync('pnpm dlx oasdiff@latest breaking --fail-on-diff api/openapi.base.json api/openapi.json', { stdio: 'inherit' });
  console.log('No breaking OpenAPI changes detected.');
} catch (err) {
  console.error('OpenAPI breaking changes detected or diff failed.');
  if (err) {
    console.error(err);
  }
  process.exit(1);
}


