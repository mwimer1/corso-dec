#!/usr/bin/env tsx
/**
 * CI Guard: Validate Orphan Allowlist
 *
 * Ensures that all paths in the orphan allowlist actually exist.
 * Prevents drift where allowlisted paths reference non-existent files.
 *
 * Usage:
 *   pnpm validate:orphans-allowlist
 */

import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const ALLOWLIST_PATH = resolve(process.cwd(), 'scripts', 'audit', 'orphans.allowlist.json');

const AllowlistSchema = z.object({
  description: z.string(),
  files: z.array(z.string()),
  notes: z.record(z.string()).optional(),
}).strict();

function main() {
  console.log('🔍 Validating orphan allowlist...\n');

  // Read allowlist
  let allowlistData: unknown;
  try {
    const content = readFileSync(ALLOWLIST_PATH, 'utf-8');
    allowlistData = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read allowlist: ${ALLOWLIST_PATH}`);
    console.error(error);
    process.exit(1);
  }

  // Validate schema
  const parsed = AllowlistSchema.safeParse(allowlistData);
  if (!parsed.success) {
    console.error('❌ Allowlist schema validation failed:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  const { files } = parsed.data;

  // Check each file exists
  const missing: string[] = [];
  const root = process.cwd();

  for (const filePath of files) {
    const absPath = resolve(root, filePath);
    if (!existsSync(absPath)) {
      missing.push(filePath);
    }
  }

  // Report results
  if (missing.length > 0) {
    console.error(`❌ Found ${missing.length} non-existent path(s) in allowlist:\n`);
    missing.forEach((path) => {
      console.error(`   - ${path}`);
    });
    console.error(
      `\n💡 Remove these entries from ${ALLOWLIST_PATH} or create the missing files.\n`
    );
    process.exit(1);
  }

  console.log(`✅ All ${files.length} allowlisted path(s) exist.\n`);
  process.exit(0);
}

void main();
