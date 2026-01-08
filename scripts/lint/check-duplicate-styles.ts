#!/usr/bin/env tsx
/**
 * Detects duplicate styling sources for the same component.
 * 
 * Flags if both a pattern CSS file (styles/ui/patterns/[name].css) and a component
 * CSS file (components/[any]/[name].module.css) exist for the same component name,
 * unless explicitly allowlisted.
 * 
 * Intent: Prevent duplicate styling sources for components
 * Files: CSS files in styles/ui/patterns and component CSS files
 * Invocation: pnpm lint (via prelint hook)
 */
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { logger, createLintResult, getRepoRoot } from './_utils';

/**
 * Guardrail: Detect duplicate styling sources for the same component.
 * 
 * Flags if both:
 * - styles/ui/patterns/[name].css exists
 * - components/[any]/[name].module.css or components/[any]/[name].css exists
 * 
 * Unless explicitly allowlisted.
 */
const ALLOWLIST = new Set<string>([
  // Add component names here if duplicate styling is intentional
  // Example: 'some-component'
]);

function main() {
  const result = createLintResult();
  const patternsDir = join(getRepoRoot(), 'styles', 'ui', 'patterns');
  
  // Check if patterns directory exists
  if (!existsSync(patternsDir)) {
    logger.success('✅ No patterns directory found - nothing to check.');
    return;
  }

  // Get all CSS files in patterns directory
  let patternFiles: string[] = [];
  try {
    patternFiles = readdirSync(patternsDir)
      .filter(f => f.endsWith('.css'))
      .map(f => basename(f, '.css'));
  } catch {
    logger.success('✅ No pattern CSS files found.');
    return;
  }

  // For each pattern file, check if corresponding component CSS exists
  for (const patternName of patternFiles) {
    if (ALLOWLIST.has(patternName)) {
      continue;
    }

    try {
      // Search for component CSS files with matching name
      const moduleCss = execSync(
        `rg --files -g "*${patternName}.module.css" components/`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();
      
      const plainCss = execSync(
        `rg --files -g "*${patternName}.css" components/`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();

      if (moduleCss || plainCss) {
        const found = [moduleCss, plainCss].filter(Boolean).join(', ');
        result.addError(
          `Duplicate styling detected for "${patternName}":\n` +
          `  - Pattern CSS: styles/ui/patterns/${patternName}.css\n` +
          `  - Component CSS: ${found}\n` +
          `  → Choose one owner. If duplicate is intentional, add "${patternName}" to ALLOWLIST.`
        );
      }
    } catch (error: any) {
      // ripgrep exits with code 1 when no matches found - this is expected
      if (error.status !== 1) {
        // Real error - log it but continue
        logger.warn(`Warning checking ${patternName}: ${error.message}`);
      }
    }
  }

  // Preserve original output format
  if (result.hasErrors()) {
    logger.error('❌ Duplicate styling sources detected:');
    for (const error of result.getErrors()) {
      logger.error(error);
    }
    process.exitCode = 1;
  } else {
    logger.success('✅ No duplicate styling sources found.');
  }
}

main();

