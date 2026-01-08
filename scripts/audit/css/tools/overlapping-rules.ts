#!/usr/bin/env tsx
/**
 * Overlapping CSS Rules Detector
 *
 * Detects duplicate or conflicting CSS rules across CSS files.
 * Identifies rules with identical selectors or overlapping specificity.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CssAuditTool, ToolContext, ToolRunResult, Finding } from '../types';
import * as postcss from 'postcss';

interface CssRule {
  selector: string;
  properties: Map<string, string>;
  file: string;
  line: number;
}

/**
 * Extract rules from CSS file
 */
function extractRules(cssContent: string, file: string): CssRule[] {
  const rules: CssRule[] = [];

  try {
    const root = postcss.parse(cssContent);
    let currentLine = 1;

    root.walkRules(rule => {
      // Skip :global() and nested rules for now (focus on top-level)
      if (rule.selector.includes(':global')) {
        return;
      }

      // Skip @media rules (handle separately if needed)
      if (rule.parent?.type === 'atrule' && rule.parent.name === 'media') {
        return;
      }

      const properties = new Map<string, string>();
      
      rule.walkDecls(decl => {
        properties.set(decl.prop, decl.value);
      });

      // Get line number
      const line = rule.source?.start?.line || currentLine;
      currentLine = line;

      rules.push({
        selector: rule.selector,
        properties,
        file,
        line,
      });
    });
  } catch {
    // Fall back to regex parsing if PostCSS fails
    const selectorPattern = /([^{]+)\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    let currentLine = 1;
    
    while ((match = selectorPattern.exec(cssContent)) !== null) {
      const selector = match[1]?.trim();
      const declarations = match[2];
      if (!selector || !declarations) continue;
      
      const properties = new Map<string, string>();
      
      // Extract properties
      const propPattern = /([^:;]+):\s*([^;]+);?/g;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = propPattern.exec(declarations)) !== null) {
        const prop = propMatch[1]?.trim();
        const value = propMatch[2]?.trim();
        if (prop && value) {
          properties.set(prop, value);
        }
      }

      // Estimate line number
      const offset = match.index ?? 0;
      currentLine = cssContent.substring(0, offset).split('\n').length;

      rules.push({
        selector,
        properties,
        file,
        line: currentLine,
      });
    }
  }

  return rules;
}

/**
 * Normalize selector for comparison
 */
function normalizeSelector(selector: string): string {
  return selector
    .replace(/\s+/g, ' ')
    .replace(/\s*>\s*/g, ' > ')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*~\s*/g, ' ~ ')
    .trim();
}

/**
 * Check if rules overlap (same selector or conflicting properties)
 */
function checkOverlap(rule1: CssRule, rule2: CssRule): {
  identical: boolean;
  conflicting: boolean;
  conflictingProps: string[];
} {
  const normalized1 = normalizeSelector(rule1.selector);
  const normalized2 = normalizeSelector(rule2.selector);

  // Check if selectors are identical
  const identical = normalized1 === normalized2;

  // Check for conflicting properties
  const conflictingProps: string[] = [];
  const conflicting: boolean = false;

  if (identical) {
    // Same selector - check for conflicting property values
    for (const [prop, value1] of rule1.properties.entries()) {
      const value2 = rule2.properties.get(prop);
      if (value2 && value1 !== value2) {
        conflictingProps.push(prop);
      }
    }
  }

  return {
    identical,
    conflicting: conflictingProps.length > 0,
    conflictingProps,
  };
}

/**
 * Create finding for overlapping rules
 */
function createFinding(
  rule1: CssRule,
  rule2: CssRule,
  type: 'identical' | 'conflicting'
): Finding {
  const selector = normalizeSelector(rule1.selector);
  const fingerprint = `css/overlapping-rules:${rule1.file}:${rule2.file}:${selector}:${type}`;
  
  const message = type === 'identical'
    ? `Duplicate CSS rule with identical selector "${selector}"`
    : `Conflicting CSS rule with same selector "${selector}" and different property values`;
  
  const hint = type === 'identical'
    ? `Consider consolidating duplicate rules from ${rule1.file} and ${rule2.file}`
    : `Property values differ: ${rule2.properties.size > 0 ? Array.from(rule2.properties.keys()).join(', ') : 'N/A'}`;

  return {
    tool: 'css-overlapping-rules',
    ruleId: 'css/overlapping-rules',
    severity: type === 'conflicting' ? 'error' : 'warn',
    ...(rule1.file ? { file: rule1.file } : {}),
    ...(typeof rule1.line === 'number' ? { line: rule1.line } : {}),
    message,
    hint,
    fingerprint,
    data: {
      selector,
      file1: rule1.file,
      ...(typeof rule1.line === 'number' ? { line1: rule1.line } : {}),
      file2: rule2.file,
      ...(typeof rule2.line === 'number' ? { line2: rule2.line } : {}),
      type,
      conflictingProps: type === 'conflicting' ? [] : [],
    },
  };
}

/**
 * Overlapping CSS Rules Tool
 */
export const overlappingRulesTool: CssAuditTool = {
  id: 'css-overlapping-rules',
  title: 'Overlapping CSS Rules',
  description: 'Detects duplicate or conflicting CSS rules across files',
  category: 'audit',
  scope: {
    kind: 'files',
    kinds: ['css', 'cssModule'],
  },
  defaultEnabled: true,

  async run(ctx, _toolConfig): Promise<ToolRunResult> {
    const findings: Finding[] = [];
    const rootDir = ctx.rootDir;

    // Collect all CSS files (regular CSS + CSS modules)
    const cssFiles = [
      ...ctx.targets.cssFiles,
      ...ctx.targets.cssModuleFiles,
    ];

    // Extract rules from all files
    const allRules: CssRule[] = [];

    for (const cssFile of cssFiles) {
      const absPath = join(rootDir, cssFile);
      
      if (!existsSync(absPath)) {
        continue;
      }

      try {
        const cssContent = readFileSync(absPath, 'utf8');
        const rules = extractRules(cssContent, cssFile);
        allRules.push(...rules);
      } catch (error) {
        ctx.warn(`Failed to process ${cssFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Compare rules for overlaps
    const processed = new Set<string>();

    for (let i = 0; i < allRules.length; i++) {
      const rule1 = allRules[i];
      if (!rule1) continue;
      const key1 = `${rule1.file}:${rule1.selector}`;

      if (processed.has(key1)) {
        continue;
      }

      for (let j = i + 1; j < allRules.length; j++) {
        const rule2 = allRules[j];
        if (!rule2) continue;

        // Skip if same file
        if (rule1.file === rule2.file) {
          continue;
        }

        const overlap = checkOverlap(rule1, rule2);

        if (overlap.identical) {
          processed.add(key1);
          
          if (overlap.conflicting) {
            findings.push(createFinding(rule1, rule2, 'conflicting'));
          } else {
            findings.push(createFinding(rule1, rule2, 'identical'));
          }
        }
      }
    }

    return {
      findings,
      stats: {
        overlappingRules: findings.length,
        rulesChecked: allRules.length,
      },
    };
  },
};
