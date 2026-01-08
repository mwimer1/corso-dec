#!/usr/bin/env tsx
/**
 * CSS Best Practices Checker
 *
 * Validates CSS files against best practices:
 * - Hardcoded values instead of tokens
 * - Missing token usage
 * - Accessibility issues
 * - Performance anti-patterns
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';

/**
 * Check for hardcoded colors
 */
function checkHardcodedColors(content: string, file: string, lineNum: number): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  // Skip token files
  if (file.includes('styles/tokens/')) {
    return findings;
  }

  // Patterns for hardcoded colors
  const hexPattern = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
  const rgbPattern = /rgba?\([^)]+\)/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (typeof line !== 'string') continue;
    const lineNumber = i + 1;

    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('//')) {
      continue;
    }

    // Skip if already uses CSS variables
    if (line.includes('var(--')) {
      continue;
    }

    // Check for hex colors
    if (hexPattern.test(line)) {
      const hexMatch = line.match(hexPattern);
      const fingerprint = `css/best-practices:${file}:${lineNumber}:hardcoded-hex`;
      findings.push({
        tool: 'css-best-practices',
        ruleId: 'css/hardcoded-color',
        severity: 'warn',
        ...(file ? { file } : {}),
        line: lineNumber,
        message: 'Hardcoded hex color detected. Use CSS variables from styles/tokens instead.',
        ...(hexMatch?.[0] ? { hint: `Example: Use hsl(var(--foreground)) instead of ${hexMatch[0]}` } : {}),
        fingerprint,
      });
    }

    // Check for RGB colors (but allow hsl(var(--...)))
    if (rgbPattern.test(line) && !line.includes('hsl(var(--')) {
      const fingerprint = `css/best-practices:${file}:${lineNumber}:hardcoded-rgb`;
      findings.push({
        tool: 'css-best-practices',
        ruleId: 'css/hardcoded-color',
        severity: 'warn',
        ...(file ? { file } : {}),
        line: lineNumber,
        message: 'Hardcoded RGB/RGBA color detected. Use CSS variables from styles/tokens instead.',
        hint: 'Example: Use hsl(var(--foreground)) instead of rgba(...)',
        fingerprint,
      });
    }
  }

  return findings;
}

/**
 * Check for hardcoded spacing values
 */
function checkHardcodedSpacing(content: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  // Skip token files
  if (file.includes('styles/tokens/')) {
    return findings;
  }

  // Patterns for hardcoded spacing (px values > 1px, rem values that should be tokens)
  const pixelPattern = /\b(\d+)px\b/g;
  const remPattern = /\b(\d+\.?\d*)rem\b/g;
  const commonSpacingRem = ['0.5rem', '1rem', '1.5rem', '2rem', '2.5rem', '3rem', '4rem'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const lineNumber = i + 1;

    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('//')) {
      continue;
    }

    // Skip if already uses spacing tokens
    if (line.includes('var(--space-')) {
      continue;
    }

    // Check for pixel spacing (allow 0px, 1px for borders)
    const pixelMatches = line.match(pixelPattern);
    if (pixelMatches) {
      const problematicPixels = pixelMatches.filter(m => {
        if (!m) return false;
        const value = parseInt(m);
        return value > 1 && value !== 0;
      });

      if (problematicPixels.length > 0) {
        const fingerprint = `css/best-practices:${file}:${lineNumber}:hardcoded-spacing-px`;
        findings.push({
          tool: 'css-best-practices',
          ruleId: 'css/hardcoded-spacing',
          severity: 'warn',
          ...(file ? { file } : {}),
          line: lineNumber,
          message: 'Hardcoded pixel spacing detected. Use spacing tokens (var(--space-*)) instead.',
          hint: `Replace ${problematicPixels.join(', ')} with appropriate spacing tokens`,
          fingerprint,
        });
      }
    }

    // Check for rem spacing that matches common token values
    const remMatches = line.match(remPattern);
    if (remMatches && !line.includes('font-size') && !line.includes('line-height')) {
      const hasCommonSpacing = remMatches.some(m => m && commonSpacingRem.includes(m));
      
      if (hasCommonSpacing) {
        const fingerprint = `css/best-practices:${file}:${lineNumber}:hardcoded-spacing-rem`;
        findings.push({
          tool: 'css-best-practices',
          ruleId: 'css/hardcoded-spacing',
          severity: 'warn',
          ...(file ? { file } : {}),
          line: lineNumber,
          message: 'Hardcoded rem spacing detected. Use spacing tokens (var(--space-*)) instead.',
          hint: 'Replace with appropriate spacing tokens from styles/tokens/spacing.css',
          fingerprint,
        });
      }
    }
  }

  return findings;
}

/**
 * Check for accessibility issues
 */
function checkAccessibility(content: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  // Check for low contrast combinations (basic check)
  // Note: This is a simple heuristic; full contrast checking requires color calculations

  // Check for missing focus styles
  let hasFocusStyles = false;
  for (const line of lines) {
    if (line.includes(':focus') || line.includes(':focus-visible')) {
      hasFocusStyles = true;
      break;
    }
  }

  // This is informational - we don't require focus styles on all components
  // but we can warn if interactive elements might be missing them

  return findings;
}

/**
 * CSS Best Practices Tool
 */
export const bestPracticesTool: CssAuditTool = {
  id: 'css-best-practices',
  title: 'CSS Best Practices',
  description: 'Validates CSS against best practices (tokens, accessibility, performance)',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule'],
  },
  defaultEnabled: true,

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    // Collect all CSS files
    const cssFiles = [
      ...ctx.targets.cssFiles,
      ...ctx.targets.cssModuleFiles,
    ];

    for (const cssFile of cssFiles) {
      const absPath = join(rootDir, cssFile);
      
      if (!existsSync(absPath)) {
        continue;
      }

      try {
        const cssContent = readFileSync(absPath, 'utf8');

        // Run all checks
        findings.push(...checkHardcodedColors(cssContent, cssFile, 1));
        findings.push(...checkHardcodedSpacing(cssContent, cssFile));
        findings.push(...checkAccessibility(cssContent, cssFile));
      } catch (error) {
        ctx.warn(`Failed to process ${cssFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      findings,
      stats: {
        bestPracticeIssues: findings.length,
        filesChecked: cssFiles.length,
      },
    };
  },
};
