#!/usr/bin/env tsx
/**
 * Route Theme Override Policy Enforcement
 * 
 * Validates that route theme files (auth.css, marketing.css, etc.) only override
 * allowed tokens. This prevents accidental overrides of spacing, typography, radius,
 * or other structural tokens that should remain consistent across themes.
 * 
 * Allowed overrides:
 * - Color tokens (--primary, --secondary, --background, --foreground, etc.)
 * - Semantic color aliases (--success, --warning, --danger, etc.)
 * - Surface variants (--surface, --surface-contrast, --surface-hover, etc.)
 * 
 * Forbidden overrides:
 * - Spacing tokens (--space-*)
 * - Typography tokens (--text-*, --font-*)
 * - Radius tokens (--radius-*)
 * - Animation tokens (--duration-*, --delay-*, --easing-*)
 * - Shadow tokens (--shadow-*)
 * - Any other structural tokens
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const TOKENS_DIR = join(REPO_ROOT, 'styles', 'tokens');

/**
 * Explicit allowlist of tokens that can be overridden in route themes
 */
const ALLOWED_OVERRIDES = new Set([
  // Base colors
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'background',
  'foreground',
  'foreground-strong',
  
  // Surface variants
  'surface',
  'surface-contrast',
  'surface-hover',
  'surface-selected',
  
  // Text hierarchy (colors only, not sizes)
  'text-high',
  'text-medium',
  'text-low',
  
  // Borders and strokes
  'border',
  'border-subtle',
  'input',
  'ring',
  
  // Semantic colors
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'danger',
  'danger-foreground',
  'info',
  'muted',
  'muted-foreground',
  
  // Extended semantic tokens
  'overlay',
]);

/**
 * Extract overridden tokens from a CSS file
 */
function extractRouteThemeOverrides(filePath: string): Array<{
  token: string;
  line: number;
  context: string;
}> {
  const content = readFileSync(filePath, 'utf-8');
  const overrides: Array<{ token: string; line: number; context: string }> = [];
  
  // Match selectors containing [data-route-theme="..."]
  const routeThemeSelectorRegex = /\[data-route-theme="[^"]+"\][^{]*\{([^}]+)\}/g;
  let selectorMatch;
  
  while ((selectorMatch = routeThemeSelectorRegex.exec(content)) !== null) {
    const blockContent = selectorMatch[1];
    if (!blockContent) continue;
    
    // Get line number
    const beforeMatch = content.substring(0, selectorMatch.index ?? 0);
    const lineNumber = beforeMatch.split('\n').length;
    
    // Extract token overrides from this block
    const tokenRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let tokenMatch: RegExpExecArray | null;
    
    while ((tokenMatch = tokenRegex.exec(blockContent) as RegExpExecArray | null) !== null) {
      const token = tokenMatch[1];
      if (token === undefined) continue;
      
      // Get context line
      const lines = content.split('\n');
      const line = lines[lineNumber - 1];
      const trimmedLine = (line?.trim() ?? '');
      const contextLine = trimmedLine.length > 80 ? trimmedLine.slice(0, 80) : trimmedLine;
      
      overrides.push({
        token: token as string,
        line: lineNumber,
        context: `${lineNumber}: ${trimmedLine}`,
      });
    }
  }
  
  return overrides;
}

/**
 * Validate route theme files
 */
function validateRouteThemes(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Find all route theme files
  const routeThemeFiles = [
    'auth.css',
    'marketing.css',
    'protected.css',
  ];
  
  for (const file of routeThemeFiles) {
    const filePath = join(TOKENS_DIR, file);
    
    try {
      // Check if file exists
      readFileSync(filePath, 'utf-8');
    } catch {
      // File doesn't exist, skip
      continue;
    }
    
    const overrides = extractRouteThemeOverrides(filePath);
    
    for (const override of overrides) {
      if (!ALLOWED_OVERRIDES.has(override.token)) {
        errors.push(
          `Forbidden token override in ${file}:\n` +
          `  Token: --${override.token}\n` +
          `  Context: ${override.context}\n` +
          `  💡 Route themes can only override color and semantic tokens.\n` +
          `     Structural tokens (spacing, typography, radius, etc.) must remain consistent.`
        );
      }
    }
  }
  
  return { errors, warnings };
}

/**
 * Main execution
 */
function main() {
  try {
    const { errors, warnings } = validateRouteThemes();
    
    // Print warnings first
    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      warnings.forEach((w) => console.warn(w));
      console.warn('');
    }
    
    // Print errors
    if (errors.length > 0) {
      console.error('❌ Route Theme Override Policy Violations:\n');
      errors.forEach((e) => console.error(e));
      console.error('\n💡 Fix: Remove forbidden overrides or add to allowlist if justified.\n');
      process.exitCode = 1;
    } else {
      // Success
      console.log('✅ Route theme override policy validated successfully');
      if (warnings.length > 0) {
        console.log(`   (${warnings.length} warning(s))`);
      }
    }
  } catch (error) {
    console.error('❌ Error validating route theme overrides:', error);
    process.exitCode = 1;
  }
}

main();

