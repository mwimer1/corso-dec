#!/usr/bin/env tsx
/**
 * Thin wrapper around ESLint rule @corso/no-deprecated-lib-imports
 * 
 * This script runs ESLint with the deprecated imports rule and formats output
 * to match the original script's format. The actual enforcement is handled by
 * the ESLint rule which reads from eslint-plugin-corso/rules/deprecated-imports.json
 * 
 * Migration: Sprint 4 - Deprecated imports now enforced via ESLint rule
 * Config: eslint-plugin-corso/rules/deprecated-imports.json
 */

import { execSync } from 'child_process';
import { createLintResult } from './_utils';

function main() {
  const result = createLintResult();
  
  try {
    // Run ESLint with the deprecated imports rule
    // The rule is already enabled in eslint.config.mjs, so we just run ESLint normally
    // and filter for deprecated import violations
    const output = execSync(
      'pnpm exec eslint --rule "corso/no-deprecated-lib-imports: error" "**/*.{ts,tsx,js,jsx,mts,mjs}"',
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      }
    );

    // If we get here, no violations found (ESLint exits with 0)
    // Do nothing, will report success below
  } catch (error: any) {
    // ESLint exits with code 1 when violations are found (expected)
    if (error.status === 1 && error.stdout) {
      const output = error.stdout.toString();
      // Parse standard ESLint output format
      // Format: path/to/file.ts
      //   42:5  error  Import path '...' is deprecated  corso/no-deprecated-lib-imports
      const lines = output.trim().split('\n').filter(Boolean);
      const violations = new Set<string>();
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check if line is a file path (next line will be the error)
        if (line.match(/^[^\s]+\.(ts|tsx|js|jsx|mts|mjs)$/)) {
          const file = line.trim();
          // Next line should be the error message
          if (i + 1 < lines.length) {
            const errorLine = lines[i + 1];
            const errorMatch = errorLine.match(/^\s+\d+:\d+\s+error\s+(.+?)\s+corso\/no-deprecated-lib-imports/);
            if (errorMatch) {
              violations.add(`${file}: ${errorMatch[1]}`);
              i++; // Skip the error line
            }
          }
        }
      }

      for (const violation of violations) {
        result.addError(violation);
      }
    } else {
      // Real error
      result.addError(`Error running ESLint: ${error.message || String(error)}`);
    }
  }

  // Preserve original output format
  if (result.hasErrors()) {
    console.error("Deprecated imports detected (use '@/lib/security/rate-limiting' instead):");
    for (const error of result.getErrors()) {
      console.error(" - " + error);
    }
    process.exitCode = 1;
  } else {
    console.log("OK: no deprecated rate-limiting imports found.");
  }
}

main();


