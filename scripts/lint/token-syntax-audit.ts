#!/usr/bin/env tsx
/**
 * Audits CSS token syntax for duplicate token definitions.
 * 
 * Scans all token files in styles/tokens directory and checks for duplicate token
 * names within the same CSS rule selector. Ensures each token is defined only once
 * per scope to prevent conflicts.
 * 
 * Intent: Prevent duplicate token definitions
 * Files: CSS files in styles/tokens directory
 * Invocation: pnpm audit:tokens
 */
import { readFileSync } from 'fs';
import { globby } from 'globby';
import { fileURLToPath } from 'node:url';
import path from 'path';
import * as postcss from 'postcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Running token syntax audit...');
  const projectRoot = path.resolve(__dirname, '..');
  const tokenFiles = await globby('styles/tokens/**/*.css', { cwd: projectRoot });

  let hasDuplicates = false;

  for (const file of tokenFiles) {
    const content = readFileSync(path.join(projectRoot, file), 'utf-8');
    const root = postcss.parse(content);

    root.walkRules(rule => {
      const tokensInScope = new Set<string>();
      rule.walkDecls(/^--/, decl => {
        const tokenName = decl.prop;
        if (tokensInScope.has(tokenName)) {
          console.error(`❌ Duplicate token found: ${tokenName} in file ${file} within selector "${rule.selector}"`);
          hasDuplicates = true;
        }
        tokensInScope.add(tokenName);
      });
    });
  }

  if (hasDuplicates) {
    console.log('🔥 Token audit failed.');
    process.exitCode = 1;
  } else {
    console.log('✅ No duplicate tokens found.');
  }
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
}); 

