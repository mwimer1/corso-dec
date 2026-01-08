#!/usr/bin/env tsx
/**
 * Generates ast-grep rules documentation from YAML files.
 * 
 * Scans all YAML files in scripts/rules/ast-grep/ and extracts metadata
 * to generate a comprehensive README.md listing all ast-grep rules.
 * 
 * Usage: tsx scripts/maintenance/generate-ast-grep-docs.ts
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');
const astGrepDir = join(repoRoot, 'scripts/rules/ast-grep');

interface AstGrepRule {
  id: string;
  message: string;
  severity: string;
  language?: string;
  files?: string | string[];
  category?: string;
  path: string;
}

/**
 * Scans ast-grep directory for YAML rule files.
 */
function scanAstGrepRules(): AstGrepRule[] {
  const rules: AstGrepRule[] = [];
  
  function scanDir(dir: string, category?: string) {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isFile() && entry.endsWith('.yml')) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const parsed = yaml.parse(content) as Record<string, any>;
          
          const ruleId = parsed['id'];
          if (ruleId) {
            // Determine category from directory structure
            let ruleCategory = category;
            if (!ruleCategory) {
              const relativePath = relative(astGrepDir, fullPath);
              const parts = relativePath.split(/[/\\]/);
              if (parts.length > 1) {
                ruleCategory = parts[0];
              } else {
                ruleCategory = 'General';
              }
            }
            
            const rule: AstGrepRule = {
              id: String(ruleId),
              message: parsed['message'] ? String(parsed['message']) : 'No message',
              severity: parsed['severity'] ? String(parsed['severity']) : 'error',
              ...(parsed['language'] ? { language: String(parsed['language']) } : {}),
              ...(parsed['files'] ? { files: parsed['files'] } : {}),
              ...(ruleCategory ? { category: ruleCategory } : {}),
              path: relative(astGrepDir, fullPath),
            };
            rules.push(rule);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to parse ${fullPath}: ${error}`);
        }
      } else if (stat.isDirectory() && !entry.startsWith('.')) {
        // Use directory name as category
        const dirCategory = category || entry;
        scanDir(fullPath, dirCategory);
      }
    }
  }
  
  scanDir(astGrepDir);
  
  return rules.sort((a, b) => {
    // Sort by category first, then by ID
    if (a.category !== b.category) {
      return (a.category || '').localeCompare(b.category || '');
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Generates the README content.
 */
function generateREADME(rules: AstGrepRule[]): string {
  // Group by category
  const byCategory = new Map<string, AstGrepRule[]>();
  for (const rule of rules) {
    const category = rule.category || 'General';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(rule);
  }
  
  const categories = Array.from(byCategory.keys()).sort();
  
  // Count by severity
  const bySeverity = new Map<string, number>();
  for (const rule of rules) {
    const severity = rule.severity || 'error';
    bySeverity.set(severity, (bySeverity.get(severity) || 0) + 1);
  }
  
  let content = `---
title: "scripts/rules/ast-grep"
last_updated: "${new Date().toISOString().split('T')[0]}"
category: "automation"
---

# AST-Grep Rules Documentation

This directory contains ast-grep rule definitions that enforce code patterns, architectural boundaries, and security standards through static analysis.

**Total Rules:** ${rules.length}  
**Categories:** ${categories.length}  
**Severity Breakdown:**
${Array.from(bySeverity.entries())
  .map(([severity, count]) => `- **${severity}**: ${count}`)
  .join('\n')}

> ⚠️ **Note**: This README is auto-generated from YAML rule files. To update documentation, edit the YAML files directly.

## Rule Categories

`;

  // Generate category sections
  for (const category of categories) {
    const categoryRules = byCategory.get(category)!;
    
    content += `### ${category}\n\n`;
    
    for (const rule of categoryRules) {
      const severityBadge = rule.severity === 'error' ? '🔴' : rule.severity === 'warning' ? '🟡' : 'ℹ️';
      const languageBadge = rule.language ? `\`${rule.language}\`` : '';
      
      content += `#### \`${rule.id}\` ${severityBadge} ${languageBadge}\n\n`;
      content += `**Message:** ${rule.message}\n\n`;
      
      if (rule.files) {
        const filesList = Array.isArray(rule.files) ? rule.files : [rule.files];
        content += `**Files:** \`${filesList.join('`, `')}\`\n\n`;
      }
      
      content += `**Path:** \`${rule.path}\`\n\n`;
    }
    
    content += '\n';
  }
  
  // ESLint vs ast-grep comparison
  content += `## ESLint vs AST-Grep

Some policies are enforced via ESLint rules, others via ast-grep. Here's the breakdown:

### ESLint-Only Policies
- Runtime boundary enforcement (client/server/edge)
- Import path validation
- Type safety checks
- API wrapper enforcement
- Environment variable access patterns

### AST-Grep-Only Policies
- Pattern-based code style enforcement
- File structure validation
- Cross-cutting concerns (e.g., no \`any\` in UI components)
- Hardening rules (e.g., no test routes in API)

### Overlapping Policies
Some policies may be enforced by both tools for redundancy or different use cases.

## Adding New Rules

To add a new ast-grep rule:

1. Create a YAML file in the appropriate category directory (or root)
2. Define the rule with required fields:
   \`\`\`yaml
   id: rule-name
   message: "Human-readable error message"
   severity: error | warning | info
   language: typescript | javascript | etc.
   files:
     - "path/pattern/**/*.ts"
   rule:
     # AST pattern or rule definition
   \`\`\`
3. Run \`pnpm docs:generate:lint\` to regenerate this documentation

## Running Rules

\`\`\`bash
# Scan all files with ast-grep
pnpm ast-grep:scan

# Validate rule syntax
pnpm validate:ast-grep
\`\`\`

---

_This documentation is auto-generated from YAML rule files. Last updated: ${new Date().toISOString().split('T')[0]}_
`;

  return content;
}

function main() {
  console.log('📖 Generating ast-grep rules documentation...');
  console.log(`   Scanning: ${astGrepDir}`);
  
  const rules = scanAstGrepRules();
  
  console.log(`   Found ${rules.length} rules`);
  
  const categories = new Set(rules.map(r => r.category || 'General'));
  console.log(`   Categories: ${categories.size}`);
  
  const readmePath = join(astGrepDir, 'README.md');
  const readmeContent = generateREADME(rules);
  
  writeFileSync(readmePath, readmeContent, 'utf-8');
  
  console.log(`   ✅ Generated: ${readmePath}`);
}

main();
