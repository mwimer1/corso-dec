#!/usr/bin/env tsx
/**
 * Generates ESLint plugin documentation from source code.
 * 
 * Reads rule definitions from eslint-plugin-corso/src/index.js and generates
 * a comprehensive README.md with rule descriptions, categories, and stub status.
 * 
 * Usage: tsx scripts/maintenance/generate-eslint-plugin-docs.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

interface RuleInfo {
  name: string;
  description?: string;
  type?: string;
  recommended?: boolean;
  fixable?: boolean | string;
  isStub: boolean;
  category?: string;
}

/**
 * Detects if a rule is a stub (minimal implementation).
 * Stub rules typically:
 * - Return empty object from create()
 * - Have no-op visitor methods
 * - Have comments indicating "stub" or "no-op"
 */
function isStubRule(ruleCode: string): boolean {
  const normalized = ruleCode.replace(/\s+/g, ' ');
  
  // Check for stub indicators
  if (normalized.includes('// Basic stub') || 
      normalized.includes('// Stub') ||
      normalized.includes('// no-op for now') ||
      normalized.includes('// Basic stub - no-op')) {
    return true;
  }
  
  // Check if create() returns empty object or minimal visitor
  const createMatch = normalized.match(/create\s*\([^)]*\)\s*\{[^}]*return\s*\{[^}]*\}/);
  if (createMatch) {
    const returnBody = createMatch[0];
    // If return body only has comments or empty visitor methods, it's likely a stub
    const visitorMethods = returnBody.match(/\w+\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
    if (visitorMethods.length === 0 || visitorMethods.every(m => m.includes('//'))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extracts rule information from the ESLint plugin source.
 */
function extractRules(source: string): RuleInfo[] {
  const rules: RuleInfo[] = [];
  
  // Match rule definitions: 'rule-name': { ... }
  const rulePattern = /['"]([\w-]+)['"]:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;
  
  while ((match = rulePattern.exec(source)) !== null) {
    const ruleName = match[1];
    const ruleBody = match[2];
    const fullRule = match[0];
    
    if (!ruleName || !ruleBody) continue;
    
    // Extract meta information
    const metaMatch = ruleBody.match(/meta:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
    let description: string | undefined;
    let type: string | undefined;
    let recommended: boolean | undefined;
    let fixable: boolean | string | undefined;
    
    if (metaMatch && metaMatch[1]) {
      const metaContent = metaMatch[1];
      
      // Extract description
      const descMatch = metaContent.match(/description:\s*['"]([^'"]+)['"]/);
      if (descMatch && descMatch[1]) {
        description = descMatch[1];
      }
      
      // Extract type
      const typeMatch = metaContent.match(/type:\s*['"]([^'"]+)['"]/);
      if (typeMatch && typeMatch[1]) {
        type = typeMatch[1];
      }
      
      // Extract recommended
      const recMatch = metaContent.match(/recommended:\s*(true|false)/);
      if (recMatch && recMatch[1]) {
        recommended = recMatch[1] === 'true';
      }
      
      // Extract fixable
      const fixMatch = metaContent.match(/fixable:\s*(['"]?[^'"]+['"]?|true|false)/);
      if (fixMatch && fixMatch[1]) {
        const fixValue = fixMatch[1];
        fixable = fixValue === 'true' ? true : fixValue === 'false' ? false : fixValue.replace(/['"]/g, '');
      }
    }
    
    // Determine if stub
    const isStub = isStubRule(fullRule);
    
    // Determine category based on rule name patterns
    let category: string | undefined;
    if (ruleName.includes('import') || ruleName.includes('domain')) {
      category = 'Import Boundaries';
    } else if (ruleName.includes('server') || ruleName.includes('client') || ruleName.includes('edge') || ruleName.includes('runtime')) {
      category = 'Runtime Boundaries';
    } else if (ruleName.includes('api') || ruleName.includes('fetch')) {
      category = 'API & Fetch';
    } else if (ruleName.includes('env') || ruleName.includes('process')) {
      category = 'Environment';
    } else if (ruleName.includes('type') || ruleName.includes('types')) {
      category = 'Type Safety';
    } else if (ruleName.includes('zod') || ruleName.includes('validation')) {
      category = 'Validation';
    } else if (ruleName.includes('security') || ruleName.includes('auth')) {
      category = 'Security';
    } else if (ruleName.includes('cta') || ruleName.includes('link') || ruleName.includes('navbar')) {
      category = 'UI Standards';
    } else if (ruleName.includes('dashboard') || ruleName.includes('entity')) {
      category = 'Dashboard';
    } else if (ruleName.includes('nextjs') || ruleName.includes('next')) {
      category = 'Next.js';
    } else if (ruleName.includes('clerk')) {
      category = 'Authentication';
    }
    
    const rule: RuleInfo = {
      name: ruleName,
      ...(description ? { description } : {}),
      ...(type ? { type } : {}),
      ...(recommended !== undefined ? { recommended } : {}),
      ...(fixable !== undefined ? { fixable } : {}),
      isStub,
      ...(category ? { category } : {}),
    };
    rules.push(rule);
  }
  
  return rules;
}

/**
 * Generates the README content.
 */
function generateREADME(rules: RuleInfo[]): string {
  const activeRules = rules.filter(r => !r.isStub);
  const stubRules = rules.filter(r => r.isStub);
  
  // Group rules by category
  const byCategory = new Map<string, RuleInfo[]>();
  for (const rule of activeRules) {
    const category = rule.category || 'Other';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(rule);
  }
  
  // Sort categories
  const categories = Array.from(byCategory.keys()).sort();
  
  let content = `---
title: "Eslint Plugin Corso"
description: "Documentation and resources for documentation functionality."
last_updated: "${new Date().toISOString().split('T')[0]}"
category: "documentation"
status: "draft"
---

# Corso ESLint Plugin

> **Comprehensive ESLint plugin enforcing Corso's architectural boundaries, security standards, and code quality rules for Next.js applications.**

## 📋 Overview

The \`@corso/eslint-plugin\` enforces Corso's strict coding standards and architectural principles across the entire codebase. It provides ${rules.length} specialized rules organized into multiple categories, ensuring consistent code quality, runtime safety, and architectural compliance.

## 📊 Rule Statistics

- **${rules.length} Total Rules** across all categories
- **${stubRules.length} Stub Rules** awaiting implementation
- **${activeRules.length} Active Rules** currently enforcing standards
- **100% TypeScript** implementation with full type safety

## 📚 Rule Categories

`;

  // Generate category sections
  for (const category of categories) {
    const categoryRules = byCategory.get(category)!;
    content += `### ${category}\n\n`;
    
    for (const rule of categoryRules.sort((a, b) => a.name.localeCompare(b.name))) {
      const badges: string[] = [];
      if (rule.recommended) badges.push('`recommended`');
      if (rule.fixable) badges.push('`fixable`');
      if (rule.type) badges.push(`\`${rule.type}\``);
      
      const badgeStr = badges.length > 0 ? ` ${badges.join(' ')}` : '';
      const desc = rule.description || 'No description available';
      
      content += `- \`${rule.name}\`${badgeStr} - ${desc}\n`;
    }
    content += '\n';
  }
  
  // Stub rules section
  if (stubRules.length > 0) {
    content += `## 🚨 Stub Rules (Future Implementation)

The following rules are currently stubs and marked for future implementation:

`;
    for (const rule of stubRules.sort((a, b) => a.name.localeCompare(b.name))) {
      const desc = rule.description || 'No description available';
      content += `- \`${rule.name}\` - ${desc}\n`;
    }
    content += '\n';
  }
  
  // Add existing configuration sections
  content += `## ⚙️ Configuration

### Domain Configuration (\`rules/domain-config.json\`)

\`\`\`json
{
  "domains": {
    "components": {
      "allowDeepImports": false,
      "publicSurface": [
        "sections", "layout", "ui", "auth", "billing",
        "dashboard", "chat", "forms", "landing", "marketing", "insights"
      ]
    },
    "lib": {
      "allowDeepImports": true,
      "publicSurface": ["index"]
    },
    "types": {
      "allowDeepImports": false,
      "publicSurface": [
        "index", "shared", "security", "auth", "billing",
        "chat", "config", "dashboard", "forms", "integrations",
        "marketing", "realtime", "validators"
      ]
    }
  }
}
\`\`\`

### Deprecated Imports Configuration (\`rules/deprecated-imports.json\`)

The \`no-deprecated-lib-imports\` rule reads from a config file to enforce deprecated import paths:

\`\`\`json
{
  "deprecatedImports": [
    {
      "path": "@/lib/actions/rate-limiting",
      "replacement": "@/lib/security/rate-limiting",
      "message": "Import path '@/lib/actions/rate-limiting' is deprecated. Use '@/lib/security/rate-limiting' instead."
    },
    {
      "pattern": "/security/rate-limiting/guards",
      "replacement": "@/lib/security/rate-limiting",
      "message": "Import path containing '/security/rate-limiting/guards' is deprecated. Use '@/lib/security/rate-limiting' instead.",
      "allowlist": [
        "lib/security/rate-limiting/guards.ts"
      ]
    }
  ]
}
\`\`\`

**Config Options:**
- \`path\` - Exact import path to ban (e.g., \`'@/lib/actions/rate-limiting'\`)
- \`pattern\` - Regex pattern to match (e.g., \`'/security/rate-limiting/guards'\`)
- \`replacement\` - Suggested replacement path
- \`message\` - Custom error message (optional)
- \`allowlist\` - Array of file paths (relative to repo root) that are allowed to use this import

**Note:** Use either \`path\` OR \`pattern\`, not both. The rule checks \`ImportDeclaration\`, dynamic \`import()\`, and \`require()\` calls.

### ESLint Configuration

\`\`\`javascript
// eslint.config.mjs
import corsoPlugin from '@corso/eslint-plugin';

export default [
  {
    plugins: {
      '@corso': corsoPlugin,
    },
    rules: {
      '@corso/no-server-in-client': 'error',
      '@corso/require-env-utilities': 'error',
      '@corso/no-hardcoded-links': 'error',
      // ... other rules
    },
  },
];
\`\`\`

## 🔍 Quality Gates

- ✅ **Runtime Safety**: All rules maintain proper client/server/edge separation
- ✅ **Type Safety**: Full TypeScript support with strict type checking
- ✅ **Architectural Compliance**: Enforces domain boundaries and import rules
- ✅ **Security Standards**: Validates authentication, validation, and security patterns

---

_This documentation is auto-generated from \`eslint-plugin-corso/src/index.js\`. Last updated: ${new Date().toISOString().split('T')[0]}_
`;

  return content;
}

function main() {
  const pluginPath = join(repoRoot, 'eslint-plugin-corso/src/index.js');
  const readmePath = join(repoRoot, 'eslint-plugin-corso/README.md');
  
  console.log('📖 Generating ESLint plugin documentation...');
  console.log(`   Reading: ${pluginPath}`);
  
  const source = readFileSync(pluginPath, 'utf-8');
  const rules = extractRules(source);
  
  console.log(`   Found ${rules.length} rules (${rules.filter(r => r.isStub).length} stubs)`);
  
  const readmeContent = generateREADME(rules);
  
  writeFileSync(readmePath, readmeContent, 'utf-8');
  
  console.log(`   ✅ Generated: ${readmePath}`);
  console.log(`   📊 Active rules: ${rules.filter(r => !r.isStub).length}`);
  console.log(`   🚧 Stub rules: ${rules.filter(r => r.isStub).length}`);
}

main();
