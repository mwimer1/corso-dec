#!/usr/bin/env tsx
/*
 * Audit unused CSS tokens in the styles system.
 *
 * Finds CSS custom properties defined in styles directory (excluding build folder)
 * that are not referenced anywhere via var(--token-name).
 *
 * Uses allowlist in styles/tokens/UNUSED.allowlist.json for intentional exceptions.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip build directories
        if (item === 'build') continue;
        walk(fullPath);
      } else if (stat.isFile() && extensions.includes(extname(item))) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function extractTokensFromFile(filePath: string): { defs: string[], uses: string[] } {
  const content = readFileSync(filePath, 'utf8');
  const defs: string[] = [];
  const uses: string[] = [];

  // Extract variable definitions
  const defMatches = content.matchAll(/^\s*--([A-Za-z0-9_-]+)\s*:/gm);
  for (const match of defMatches) {
    if (match[1]) {
      defs.push(match[1]);
    }
  }

  // Extract variable usages
  const useMatches = content.matchAll(/var\(--([A-Za-z0-9_-]+)\)/g);
  for (const match of useMatches) {
    if (match[1]) {
      uses.push(match[1]);
    }
  }

  return { defs, uses };
}

function main() {
  try {
    // Find all relevant files
    const cssFiles = findFiles('styles', ['.css']);
    const codeFiles = findFiles('.', ['.css', '.ts', '.tsx', '.js', '.jsx']);

    // Collect all definitions and usages
    const allDefs: string[] = [];
    const allUses: string[] = [];

    for (const file of cssFiles) {
      const { defs } = extractTokensFromFile(file);
      allDefs.push(...defs);
    }

    for (const file of codeFiles) {
      // Skip files in build directories
      if (file.includes('/build/') || file.includes('\\build\\')) continue;

      const { uses } = extractTokensFromFile(file);
      allUses.push(...uses);
    }

    // Load allowlist
    const allowlistPath = join(process.cwd(), 'styles', 'tokens', 'UNUSED.allowlist.json');
    const allowlistData = JSON.parse(readFileSync(allowlistPath, 'utf8'));
    const allowed = allowlistData.allowed || [];

    // Create allowlist regex
    const allowRE = new RegExp(
      '^(' +
      allowed
        .map((pattern: string) => pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*'))
        .join('|') +
      ')$'
    );

    // Find unused tokens
    const uniqueDefs = [...new Set(allDefs)];
    const uniqueUses = [...new Set(allUses)];
    const unusedTokens = uniqueDefs
      .filter(token => !uniqueUses.includes(token))
      .filter(token => !allowRE.test(token))
      .sort();

    console.log(JSON.stringify({ unusedTokens }, null, 2));
  } catch (error) {
    console.error('Error running unused tokens audit:', error);
    process.exit(1);
  }
}

// Run main function
main();

