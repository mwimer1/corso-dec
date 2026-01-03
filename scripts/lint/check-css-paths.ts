#!/usr/bin/env tsx
/**
 * Validates that all CSS files are located in the styles/ directory.
 * 
 * Scans the repository for CSS files outside the styles/ directory and reports
 * them as errors to enforce consistent file organization.
 * 
 * Intent: Enforce CSS file organization standards
 * Files: All .css files outside styles/ directory
 * Invocation: pnpm lint (via prelint hook)
 */
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

