#!/usr/bin/env tsx
/**
 * Validates React hook dependency arrays for exhaustive-deps compliance.
 * 
 * Runs ESLint with exhaustive-deps rule on hook files in components subdirectories
 * to ensure all React hooks (useEffect, useMemo, useCallback, etc.) have complete dependency arrays.
 * 
 * Note: Hooks have been moved from top-level hooks/ directory to domain homes
 * (components/ui/hooks/, components/chat/hooks/, etc.)
 * 
 * Intent: Enforce exhaustive-deps rule for React hooks
 * Files: TypeScript files in components subdirectory hook directories
 * Invocation: pnpm validate:effect-deps
 */
import { exec } from 'child_process';
import { fileURLToPath } from 'node:url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function main() {
  // Check hooks in their new locations: components/**/hooks/
  const eslintCommand = `eslint -c scripts/eslint-deps-check.config.js "components/**/hooks/**/*.{ts,tsx}"`;

  exec(eslintCommand, { cwd: ROOT_DIR }, (error, stdout, stderr) => {
    if (error) {
      console.error('Exhaustive-deps check failed:');
      console.error(stderr);
      console.log(stdout);
      process.exitCode = 1;
      return;
    }

    if (stdout) {
      console.log(stdout);
    }

    console.log('Exhaustive-deps check passed.');
  });
}

main(); 

