#!/usr/bin/env tsx
/**
 * Check for server-only code in pages directory
 * Windows-compatible replacement for Bash conditional
 */

import * as fs from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getRepoRoot } from './_utils';

const pagesDir = join(getRepoRoot(), 'pages');
const ruleFile = join(getRepoRoot(), 'scripts/rules/ast-grep/patterns/no-server-only-in-pages.yml');

function main() {
  if (fs.existsSync(pagesDir) && fs.statSync(pagesDir).isDirectory()) {
    try {
      execSync(
        `pnpm --package=@ast-grep/cli dlx sg scan --rule ${ruleFile} pages`,
        { stdio: 'inherit', cwd: getRepoRoot() }
      );
    } catch (error) {
      process.exitCode = 1;
    }
  } else {
    console.log('No pages directory found - skipping check');
  }
}

main();

