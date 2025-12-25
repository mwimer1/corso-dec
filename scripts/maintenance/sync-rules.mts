#!/usr/bin/env node
/**
 * Synchronize canonical rules to generated surfaces.
 * - Canonical: .cursor/rules/corso-assistant.mdc
 * - Generated: .cursor/rules/corso-dev.md
 * - Inventory:  .cursor/rules/_index.json
 *
 * Node 18+ / ESM. Run with: pnpm rules:sync
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const CURSOR_RULES_DIR = join(ROOT, '.cursor', 'rules');

const CANONICAL = join(CURSOR_RULES_DIR, 'corso-assistant.mdc');
// Mirror will be written into the canonical rules folder to avoid a separate .agent prose copy
const AGENT_OUT = join(CURSOR_RULES_DIR, 'corso-dev.md');
const RULES_INDEX = join(CURSOR_RULES_DIR, '_index.json');

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

async function main() {
  ensureDir(CURSOR_RULES_DIR);

  if (!existsSync(CANONICAL)) {
    console.error(`[rules:sync] Missing canonical rules at ${CANONICAL}`);
    process.exit(1);
  }

  const canonicalMd = readFileSync(CANONICAL, 'utf8');

  // Build .cursor/rules/corso-dev.md with banner + canonical content
  const banner = [
    '<!--',
    '  AUTO-GENERATED FILE — DO NOT EDIT BY HAND.',
    '  Source: .cursor/rules/corso-assistant.mdc',
    `  Generated: ${new Date().toISOString()}`,
    '-->',
    '',
  ].join('\n');

  // We intentionally do NOT mirror .agent indexes here — those index files are preserved but
  // the generated prose is kept under `.cursor/rules` to enforce single source of truth.
  const agentMd = `${banner}\n${canonicalMd}\n`;

  writeFileSync(AGENT_OUT, agentMd, 'utf8');
  console.log(`[rules:sync] Wrote ${AGENT_OUT}`);

  // Build a minimal _index.json inventory for .cursor/rules using shared library
  const { buildMinimalIndex, writeIndex } = await import('../rules/lib/build-index');
  const index = buildMinimalIndex(CURSOR_RULES_DIR, 'corso-assistant.mdc');
  writeIndex(RULES_INDEX, index);
  console.log(`[rules:sync] Wrote ${RULES_INDEX}`);

  console.log('[rules:sync] Done.');
}

main();


