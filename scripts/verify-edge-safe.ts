#!/usr/bin/env tsx
/**
 * Node.js wrapper for verify-edge-safe.ps1
 * Cross-platform Edge runtime safety verification
 *
 * Usage:
 *   pnpm run verify:edge
 *   tsx scripts/verify-edge-safe.ts
 */

import { readFileSync } from 'fs';
import { globby } from 'globby';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const ROOT = resolve(__dirname, '..');

interface Violation {
  file: string;
  issue: string;
  line?: number;
}


async function verifyEdgeSafety(): Promise<void> {
  console.log('🔍 Verifying Edge Runtime Safety...');
  console.log('Root directory:', ROOT);

  const edgeRoutes = [
    'app/api/chat/**/*.ts',
    'app/api/dashboard/**/*.ts',
    'app/api/auth/**/*.ts',
  ];

  const forbiddenImports = [
    'fs',
    'path',
    'os',
    'child_process',
    'crypto',
    'stream',
    'util',
    'url',
    'querystring',
    'http',
    'https',
    'zlib',
    'dns',
    'net',
    'tls',
    'events',
    'buffer',
  ];

  const violations: Violation[] = [];

  for (const pattern of edgeRoutes) {
    const files = await globby(pattern, { cwd: ROOT });

    if (files.length === 0) {
      console.log(`  No files found for pattern: ${pattern}`);
      continue;
    }

    for (const file of files) {
      const filePath = resolve(ROOT, file);
      const content = readFileSync(filePath, 'utf8');

      // Check for forbidden imports
      for (const forbidden of forbiddenImports) {
        const importRegex = new RegExp(`import.*from.*['"']${forbidden}['"']|require.*['"']${forbidden}['"']`, 'g');
        const matches = content.match(importRegex);

        if (matches) {
          violations.push({
            file,
            issue: `Forbidden import in Edge route: ${forbidden}`,
          });
        }
      }

      // Check for dynamic imports
      const dynamicImportRegex = /import.*\$\{.*\}.*from|require.*\$\{.*\}.*from/g;
      if (dynamicImportRegex.test(content)) {
        violations.push({
          file,
          issue: 'Dynamic import detected - manual review required',
        });
      }

      // Check for process.env usage (Node.js specific) — prefer getEnv() in scripts
      if (content.includes('process.env[') || content.includes('process.env.')) {
        // Allow usages that reference our getEnv() wrapper
        if (!/getEnv\(/.test(content)) {
          violations.push({
            file,
            issue: 'process.env usage not allowed in Edge',
          });
        }
      }

      // Check for Node.js globals
      if (content.includes('__dirname') || content.includes('__filename')) {
        violations.push({
          file,
          issue: 'Node.js globals not available in Edge',
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log('✅ All Edge routes are safe from Node.js imports');
  } else {
    console.log(`❌ Found ${violations.length} Edge runtime safety issues:`);
    for (const violation of violations) {
      console.log(`  - ${violation.file}: ${violation.issue}`);
    }
    process.exit(1);
  }

  console.log('✅ Edge runtime verification complete');
}

// Run the script when executed directly
verifyEdgeSafety().catch(console.error);

