#!/usr/bin/env tsx
/**
 * Generates scripts/lint documentation from JSDoc headers.
 * 
 * Scans all TypeScript files in scripts/lint/ and extracts JSDoc comments
 * to generate a comprehensive README.md listing all lint scripts.
 * 
 * Usage: tsx scripts/maintenance/generate-lint-scripts-docs.ts
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');
const lintDir = join(repoRoot, 'scripts/lint');

interface ScriptInfo {
  filename: string;
  description: string;
  intent?: string;
  files?: string;
  invocation?: string;
}

/**
 * Extracts JSDoc comment from the beginning of a TypeScript file.
 */
function extractJSDoc(content: string): ScriptInfo | null {
  // Match JSDoc comment at the start of the file (after shebang if present)
  const jsdocPattern = /^#!\/usr\/bin\/env\s+tsx\s*\n\/\*\*\s*\n([\s\S]*?)\s*\*\/\s*\n/;
  const match = content.match(jsdocPattern);
  
  if (!match) {
    // Try without shebang
    const jsdocPattern2 = /^\/\*\*\s*\n([\s\S]*?)\s*\*\/\s*\n/;
    const match2 = content.match(jsdocPattern2);
    if (!match2 || !match2[1]) return null;
    return parseJSDoc(match2[1]);
  }
  
  if (!match[1]) return null;
  return parseJSDoc(match[1]);
}

/**
 * Parses JSDoc content to extract structured information.
 */
function parseJSDoc(jsdocContent: string): ScriptInfo {
  const lines = jsdocContent
    .split('\n')
    .map(line => line.replace(/^\s*\*\s*/, '').trim())
    .filter(line => line.length > 0);
  
  let description = '';
  let intent: string | undefined;
  let files: string | undefined;
  let invocation: string | undefined;
  
  let currentSection: 'description' | 'intent' | 'files' | 'invocation' | null = 'description';
  
  for (const line of lines) {
    if (line.startsWith('Intent:')) {
      intent = line.replace('Intent:', '').trim();
      currentSection = 'intent';
    } else if (line.startsWith('Files:')) {
      files = line.replace('Files:', '').trim();
      currentSection = 'files';
    } else if (line.startsWith('Invocation:')) {
      invocation = line.replace('Invocation:', '').trim();
      currentSection = 'invocation';
    } else if (line.trim().length > 0) {
      // Accumulate description or section content
      if (currentSection === 'description') {
        if (description) description += ' ';
        description += line;
      } else if (currentSection === 'intent' && !intent) {
        intent = line;
      } else if (currentSection === 'files' && !files) {
        files = line;
      } else if (currentSection === 'invocation' && !invocation) {
        invocation = line;
      }
    }
  }
  
  // If no explicit description, use first paragraph
  if (!description && lines.length > 0) {
    description = lines[0] || '';
  }
  
  const info: ScriptInfo = {
    filename: '',
    description: description || 'No description available',
  };
  
  if (intent) {
    info.intent = intent;
  }
  if (files) {
    info.files = files;
  }
  if (invocation) {
    info.invocation = invocation;
  }
  
  return info;
}

/**
 * Scans scripts/lint directory for TypeScript files.
 */
function scanLintScripts(): ScriptInfo[] {
  const scripts: ScriptInfo[] = [];
  
  function scanDir(dir: string) {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && entry === '_utils') {
        // Skip _utils directory
        continue;
      }
      
      if (stat.isFile() && entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        const content = readFileSync(fullPath, 'utf-8');
        const info = extractJSDoc(content);
        
        if (info) {
          info.filename = relative(lintDir, fullPath);
          scripts.push(info);
        } else {
          // Include even without JSDoc, but mark as needing documentation
          scripts.push({
            filename: relative(lintDir, fullPath),
            description: 'No description available',
          });
        }
      } else if (stat.isDirectory() && !entry.startsWith('.')) {
        scanDir(fullPath);
      }
    }
  }
  
  scanDir(lintDir);
  
  return scripts.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Generates the README content.
 */
function generateREADME(scripts: ScriptInfo[]): string {
  const documented = scripts.filter(s => s.description !== 'No description available');
  const undocumented = scripts.filter(s => s.description === 'No description available');
  
  let content = `---
title: "scripts/lint"
last_updated: "${new Date().toISOString().split('T')[0]}"
category: "automation"
---

# Lint Scripts Documentation

This directory contains TypeScript lint scripts that enforce code quality, architectural boundaries, and repository standards.

**Total Scripts:** ${scripts.length}  
**Documented:** ${documented.length}  
**Undocumented:** ${undocumented.length}

> ⚠️ **Note**: This README is auto-generated from JSDoc comments in the script files. To update documentation, edit the JSDoc header at the top of each script file.

## Shared Utilities

Lint scripts use shared utilities from \`scripts/lint/_utils/\`:
- **files.ts** - File walking and globbing (\`findFiles\`, \`findFilesGlob\`)
- **paths.ts** - Path normalization (\`getRepoRoot\`, \`resolveFromRepo\`, \`normalizePath\`)
- **log.ts** - Standardized logging (re-exports \`logger\` from \`scripts/utils/logger\`)
- **result.ts** - Error collection and exit code handling (\`LintResult\`, \`createLintResult\`)

**Usage example:**
\`\`\`typescript
import { findFiles, getRepoRoot, logger, createLintResult } from './_utils';

const result = createLintResult();
const files = findFiles('**/*.ts');
// ... check files ...
result.report({ successMessage: '✅ All checks passed' });
\`\`\`

## Scripts in \`scripts/lint\`

`;

  // Generate script entries
  for (const script of scripts) {
    const name = script.filename.replace(/\.ts$/, '');
    const parts: string[] = [];
    
    if (script.intent) {
      parts.push(`**Intent:** ${script.intent}`);
    }
    if (script.files) {
      parts.push(`**Files:** ${script.files}`);
    }
    if (script.invocation) {
      parts.push(`**Invocation:** ${script.invocation}`);
    }
    
    const metadata = parts.length > 0 ? `\n  ${parts.join('\n  ')}` : '';
    
    content += `### \`${name}\`\n\n`;
    content += `${script.description}${metadata}\n\n`;
  }
  
  if (undocumented.length > 0) {
    content += `## ⚠️ Scripts Needing Documentation

The following scripts need JSDoc headers:

`;
    for (const script of undocumented) {
      content += `- \`${script.filename}\`\n`;
    }
    content += '\n';
  }
  
  content += `## Adding Documentation

To document a script, add a JSDoc comment at the top of the file:

\`\`\`typescript
#!/usr/bin/env tsx
/**
 * Brief description of what the script does.
 * 
 * Intent: What problem this script solves
 * Files: Which files or patterns it scans
 * Invocation: How it's invoked (e.g., "pnpm lint:script-name")
 */
\`\`\`

---

_This documentation is auto-generated from JSDoc comments. Last updated: ${new Date().toISOString().split('T')[0]}_
`;

  return content;
}

function main() {
  console.log('📖 Generating scripts/lint documentation...');
  console.log(`   Scanning: ${lintDir}`);
  
  const scripts = scanLintScripts();
  
  console.log(`   Found ${scripts.length} scripts`);
  console.log(`   Documented: ${scripts.filter(s => s.description !== 'No description available').length}`);
  console.log(`   Undocumented: ${scripts.filter(s => s.description === 'No description available').length}`);
  
  const readmePath = join(lintDir, 'README.md');
  const readmeContent = generateREADME(scripts);
  
  writeFileSync(readmePath, readmeContent, 'utf-8');
  
  console.log(`   ✅ Generated: ${readmePath}`);
}

main();
