#!/usr/bin/env tsx
// scripts/lint/check-css-paths.ts

import { execSync } from 'child_process';
import { logger, createLintResult } from './_utils';

function main() {
  const result = createLintResult();
  
  try {
    const output = execSync("rg --files -tcss --glob '!styles/**/*' .", {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (output) {
      result.addError('CSS files found outside styles/ directory:');
      for (const file of output.split('\n').filter(Boolean)) {
        result.addError(`  ${file}`);
      }
    }
  } catch (error: any) {
    if (error.status === 1) {
      // ripgrep exit code 1 means no matches (success)
      // Do nothing, will report success below
    } else {
      result.addError(`Error running ripgrep: ${error.message || String(error)}`);
    }
  }

  result.report({
    successMessage: '✅ No stray CSS files found.',
    errorPrefix: '❌',
  });
}

main();

