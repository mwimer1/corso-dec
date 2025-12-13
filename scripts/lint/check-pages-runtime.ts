#!/usr/bin/env node
/**
 * Check for server-only code in pages directory
 * Windows-compatible replacement for Bash conditional
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const pagesDir = path.resolve(process.cwd(), 'pages');
const ruleFile = path.resolve(process.cwd(), 'scripts/rules/ast-grep/patterns/no-server-only-in-pages.yml');

if (fs.existsSync(pagesDir) && fs.statSync(pagesDir).isDirectory()) {
  try {
    execSync(
      `pnpm --package=@ast-grep/cli dlx sg scan --rule ${ruleFile} pages`,
      { stdio: 'inherit', cwd: process.cwd() }
    );
  } catch (error) {
    process.exit(1);
  }
} else {
  console.log('No pages directory found - skipping check');
  process.exit(0);
}

