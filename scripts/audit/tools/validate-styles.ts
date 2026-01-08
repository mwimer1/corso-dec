#!/usr/bin/env tsx
/**
 * Validate Styles Adapter
 *
 * Wraps validate-styles.ts as a CSS audit tool.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { globby } from 'globby';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import { getRelativePath } from '../../lint/_utils/paths';

const HEX_COLOR_PATTERN = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
const RGB_COLOR_PATTERN = /rgba?\([^)]+\)/gi;
const PIXEL_VALUE_PATTERN = /\b(\d+)px\b/g;
const REM_VALUE_PATTERN = /\b(\d+\.?\d*)rem\b/g;

const ALLOWED_INLINE_PATTERNS = [
  /width:\s*['"`]?\d+%['"`]?/,
  /height:\s*['"`]?\d+%['"`]?/,
  /transform:/,
  /opacity:\s*['"`]?\d+\.?\d*['"`]?/,
  /z-index:/,
  /display:\s*['"`]?(none|block|flex|grid)['"`]?/,
];

function isAllowedInlineStyle(styleContent: string): boolean {
  return ALLOWED_INLINE_PATTERNS.some(pattern => pattern.test(styleContent));
}

/**
 * Validate Styles Tool
 */
export const validateStylesTool: CssAuditTool = {
  id: 'css-validate-styles',
  title: 'Validate Styles',
  description: 'Validates that components and CSS files follow styling standards (no inline styles, no hardcoded values)',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule', 'tsx'],
  },
  defaultEnabled: true,

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    try {
      ctx.log('Validating styles (inline styles and hardcoded values)...');

      // Check React components
      const componentPatterns = [
        'components/**/*.{tsx,jsx}',
        'app/**/*.{tsx,jsx}',
      ];

      const ignorePatterns = [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        '**/__snapshots__/**',
      ];

      const componentFiles = await globby(componentPatterns, {
        ignore: ignorePatterns,
        absolute: false,
        cwd: rootDir,
      });

      // Check inline styles in components
      for (const file of componentFiles) {
        if (!ctx.targets.allFiles.includes(file) && ctx.targets.mode === 'changed') {
          continue;
        }

        const absPath = join(rootDir, file);
        if (!existsSync(absPath)) continue;

        try {
          const content = readFileSync(absPath, 'utf8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const styleMatch = line.match(/style\s*=\s*\{[\s\S]*?\}|\s*style\s*=\s*["'][^"']*["']/);
            if (!styleMatch) continue;

            const styleContent = styleMatch[0];
            if (isAllowedInlineStyle(styleContent)) continue;

            // Check for hardcoded colors
            if (HEX_COLOR_PATTERN.test(styleContent) || RGB_COLOR_PATTERN.test(styleContent)) {
              const fingerprint = `css-validate-styles:inline-color:${file}:${i + 1}`;
              findings.push({
                tool: 'css-validate-styles',
                ruleId: 'css/inline-style-color',
                severity: 'warn',
                file: getRelativePath(absPath),
                line: i + 1,
                message: 'Inline style contains hardcoded color. Use CSS classes with design tokens instead.',
                hint: 'Use CSS classes with Tailwind utilities or CSS modules instead of inline styles',
                fingerprint,
              });
            }

            // Check for hardcoded pixel values
            const pixelMatches = styleContent.match(PIXEL_VALUE_PATTERN);
            if (pixelMatches) {
              const problematicPixels = pixelMatches.filter(m => {
                const value = parseInt(m);
                return value > 1 && value !== 0;
              });

              if (problematicPixels.length > 0) {
                const fingerprint = `css-validate-styles:inline-spacing:${file}:${i + 1}`;
                findings.push({
                  tool: 'css-validate-styles',
                  ruleId: 'css/inline-style-spacing',
                  severity: 'warn',
                  file: getRelativePath(absPath),
                  line: i + 1,
                  message: 'Inline style contains hardcoded pixel values. Use CSS classes with spacing tokens instead.',
                  hint: 'Use spacing tokens via Tailwind utilities or CSS modules',
                  fingerprint,
                });
              }
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }

      // Check CSS files for hardcoded values
      const cssFiles = [
        ...ctx.targets.cssFiles,
        ...ctx.targets.cssModuleFiles,
      ];

      for (const file of cssFiles) {
        const absPath = join(rootDir, file);
        if (!existsSync(absPath)) continue;

        // Skip token files
        if (file.includes('styles/tokens/')) continue;

        try {
          const content = readFileSync(absPath, 'utf8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            // Skip comments
            if (line.trim().startsWith('/*') || line.trim().startsWith('//')) continue;
            // Skip if already uses CSS variables
            if (line.includes('var(--')) continue;

            // Check for hardcoded hex colors
            const hexMatches = line.match(HEX_COLOR_PATTERN);
            if (hexMatches) {
              const commentIndex = line.indexOf('/*');
              const hexIndex = line.indexOf(hexMatches[0]);
              if (commentIndex === -1 || hexIndex < commentIndex) {
                const fingerprint = `css-validate-styles:hardcoded-hex:${file}:${i + 1}`;
                findings.push({
                  tool: 'css-validate-styles',
                  ruleId: 'css/hardcoded-color',
                  severity: 'warn',
                  file: getRelativePath(absPath),
                  line: i + 1,
                  message: 'Hardcoded hex color detected. Use CSS variables from styles/tokens instead.',
                  hint: `Example: Use hsl(var(--foreground)) instead of ${hexMatches[0]}`,
                  fingerprint,
                });
              }
            }

            // Check for hardcoded RGB colors
            if (RGB_COLOR_PATTERN.test(line)) {
              const fingerprint = `css-validate-styles:hardcoded-rgb:${file}:${i + 1}`;
              findings.push({
                tool: 'css-validate-styles',
                ruleId: 'css/hardcoded-color',
                severity: 'warn',
                file: getRelativePath(absPath),
                line: i + 1,
                message: 'Hardcoded RGB/RGBA color detected. Use CSS variables from styles/tokens instead.',
                hint: 'Example: Use hsl(var(--foreground)) instead of rgba(...)',
                fingerprint,
              });
            }

            // Check for hardcoded pixel spacing
            const pixelMatches = line.match(PIXEL_VALUE_PATTERN);
            if (pixelMatches) {
              const problematicPixels = pixelMatches.filter(m => {
                const value = parseInt(m);
                return value > 1;
              });

              if (problematicPixels.length > 0) {
                const fingerprint = `css-validate-styles:hardcoded-spacing-px:${file}:${i + 1}`;
                findings.push({
                  tool: 'css-validate-styles',
                  ruleId: 'css/hardcoded-spacing',
                  severity: 'warn',
                  file: getRelativePath(absPath),
                  line: i + 1,
                  message: 'Hardcoded pixel spacing detected. Use spacing tokens (var(--space-*)) instead.',
                  hint: 'Replace with appropriate spacing tokens from styles/tokens/spacing.css',
                  fingerprint,
                });
              }
            }

            // Check for hardcoded rem spacing
            const remMatches = line.match(REM_VALUE_PATTERN);
            if (remMatches && !line.includes('font-size') && !line.includes('line-height')) {
              const spacingRemValues = ['0.5rem', '1rem', '1.5rem', '2rem', '2.5rem', '3rem', '4rem'];
              const hasSpacingRem = remMatches.some(m => m && spacingRemValues.includes(m));

              if (hasSpacingRem) {
                const fingerprint = `css-validate-styles:hardcoded-spacing-rem:${file}:${i + 1}`;
                findings.push({
                  tool: 'css-validate-styles',
                  ruleId: 'css/hardcoded-spacing',
                  severity: 'warn',
                  file: getRelativePath(absPath),
                  line: i + 1,
                  message: 'Hardcoded rem spacing detected. Use spacing tokens (var(--space-*)) instead.',
                  hint: 'Replace with appropriate spacing tokens from styles/tokens/spacing.css',
                  fingerprint,
                });
              }
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }

      ctx.log(`  Found ${findings.length} style validation issues`);
    } catch (error) {
      ctx.warn(`Style validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      findings,
      stats: {
        violations: findings.length,
      },
    };
  },
};
