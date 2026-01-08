#!/usr/bin/env tsx
/**
 * Content validation for documentation files
 * 
 * Validates:
 * - Banned patterns (e.g., process.env usage in docs)
 * - Code block sanity checks
 * - Environment variable documentation completeness
 * - Code snippet patterns match actual codebase
 * 
 * Usage:
 *   pnpm run validate:docs:content
 *   tsx scripts/maintenance/validate-docs-content.ts
 */

import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkBannedPatterns, extractCodeBlocks, type CodeBlock, type ValidationIssue } from './validate-docs-content.utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};

/**
 * Validate TypeScript/JavaScript code blocks
 */
function validateCodeBlocks(blocks: CodeBlock[], filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Whitelist of specific file:line combinations (same as in checkBannedPatterns)
  // These are legitimate exceptions: NODE_ENV checks, test setup code, and build config
  const whitelistEntries = [
    'docs/reference/env.md:788',
    'docs/reference/env.md:801',
    'docs/maintenance/nextjs-16-upgrade-guide.md:243',
    'docs/quality/testing-guide.md:506',
    'docs/quality/testing-guide.md:524',
    'docs/references/env.md:756',
    'docs/references/env.md:768',
    'docs/references/env.md:781',
    'docs/upgrades/nextjs-16-upgrade-guide.md:245',
    'docs/testing-quality/testing-guide.md:508',
    'docs/testing-quality/testing-guide.md:525',
    'docs/development/coding-standards.md:395',
    'docs\\reference\\env.md:788',
    'docs\\reference\\env.md:801',
    'docs\\maintenance\\nextjs-16-upgrade-guide.md:243',
    'docs\\quality\\testing-guide.md:506',
    'docs\\quality\\testing-guide.md:524',
    'docs\\references\\env.md:756',
    'docs\\references\\env.md:768',
    'docs\\references\\env.md:781',
    'docs\\upgrades\\nextjs-16-upgrade-guide.md:245',
    'docs\\testing-quality\\testing-guide.md:508',
    'docs\\testing-quality\\testing-guide.md:525',
    'docs\\development\\coding-standards.md:395',
  ];
  const whitelist = new Set(whitelistEntries);
  const normalizedFilePath = filePath.replace(/\\/g, '/');

  for (const block of blocks) {
    // Only validate TypeScript/JavaScript blocks
    if (!block.language || !['typescript', 'ts', 'javascript', 'js', 'tsx', 'jsx'].includes(block.language)) {
      continue;
    }

    const content = block.content;

    // Check for common issues in code examples
    if (content.includes('process.env[') || content.includes('process.env.')) {
      // Allow if it's clearly showing the wrong way
      if (!content.includes('❌') && !content.includes('INCORRECT') && !content.includes('// ❌')) {
        // Check whitelist before creating issue
        const whitelistKey1 = `${normalizedFilePath}:${block.startLine}`;
        const whitelistKey2 = `${filePath}:${block.startLine}`;
        if (!whitelist.has(whitelistKey1) && !whitelist.has(whitelistKey2)) {
          issues.push({
            file: filePath,
            line: block.startLine,
            issue: 'Code block contains direct process.env usage without indicating it\'s the wrong pattern',
            severity: 'warning',
          });
        }
      }
    }

    // Check for import patterns that should match codebase conventions
    const importPattern = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath) continue;
      // Check if it's a relative import that might be broken
      if (importPath.startsWith('.')) {
        // This is a relative import - we can't validate it without context
        // But we can warn if it looks suspicious
        if (importPath.includes('..') && importPath.split('..').length > 3) {
          issues.push({
            file: filePath,
            line: block.startLine,
            issue: `Deep relative import in code block: ${importPath} (may be incorrect)`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Extract environment variables from ValidatedEnv type
 */
async function extractEnvVarsFromCode(): Promise<Set<string>> {
  const envFile = path.join(ROOT, 'lib', 'server', 'env.ts');
  if (!existsSync(envFile)) {
    logger.warn('Could not find lib/server/env.ts to extract env vars');
    return new Set();
  }

  const content = readFileSync(envFile, 'utf8');
  const envVars = new Set<string>();

  // Extract env vars from getEnv() implementation
  // Pattern: KEY: g('KEY')
  const envVarPattern = /([A-Z_][A-Z0-9_]*):\s*g\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g;
  let match;
  while ((match = envVarPattern.exec(content)) !== null) {
    const varName = match[2] || match[1];
    if (varName) {
      envVars.add(varName);
    }
  }

  // Also extract from nested patterns like CORSO_USE_MOCK_DB: (() => { ... g('CORSO_USE_MOCK_DB') ... })()
  const nestedPattern = /g\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g;
  while ((match = nestedPattern.exec(content)) !== null) {
    if (match[1]) {
      envVars.add(match[1]);
    }
  }

  return envVars;
}

/**
 * Extract documented environment variables from docs
 */
async function extractDocumentedEnvVars(): Promise<Map<string, { file: string; line: number }>> {
  const documented = new Map<string, { file: string; line: number }>();
  const docFiles = await glob('docs/**/*.md', { cwd: ROOT });

  for (const file of docFiles) {
    const filePath = path.join(ROOT, file);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Look for env var documentation patterns:
    // ## VAR_NAME
    // ## VAR_NAME (with description)
    // - VAR_NAME: description
    const headingPattern = /^##\s+([A-Z_][A-Z0-9_]*)/;
    const listPattern = /^[-*]\s+([A-Z_][A-Z0-9_]*):/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const headingMatch = headingPattern.exec(line);
      const listMatch = listPattern.exec(line);

      if (headingMatch) {
        const varName = headingMatch[1];
        if (varName && !documented.has(varName)) {
          documented.set(varName, { file, line: i + 1 });
        }
      } else if (listMatch) {
        const varName = listMatch[1];
        if (varName && !documented.has(varName)) {
          documented.set(varName, { file, line: i + 1 });
        }
      }
    }
  }

  return documented;
}

/**
 * Validate environment variable documentation completeness
 */
async function validateEnvVarDocumentation(): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  logger.info('Extracting environment variables from code...');
  const codeEnvVars = await extractEnvVarsFromCode();
  
  logger.info('Extracting documented environment variables...');
  const documentedEnvVars = await extractDocumentedEnvVars();

  // Find undocumented env vars
  const undocumented: string[] = [];
  for (const varName of codeEnvVars) {
    // Skip internal/private vars that shouldn't be documented
    // Also skip platform/framework variables (Next.js, Vercel)
    if (varName.startsWith('_') || 
        varName === 'NODE_ENV' || 
        varName === 'NEXT_RUNTIME' || 
        varName === 'NEXT_PHASE' ||
        varName === 'VERCEL_ENV' ||
        varName === 'NEXT_TELEMETRY_DISABLED') {
      continue;
    }
    
    if (!documentedEnvVars.has(varName)) {
      undocumented.push(varName);
    }
  }

  if (undocumented.length > 0) {
    logger.warn(`Found ${undocumented.length} undocumented environment variables:`);
    for (const varName of undocumented) {
      issues.push({
        file: 'docs/references/env.md',
        issue: `Environment variable ${varName} is used in code but not documented`,
        severity: 'warning',
      });
      logger.warn(`  - ${varName}`);
    }
  }

  // Find documented but unused vars (less critical, just info)
  const documentedButUnused: string[] = [];
  for (const varName of documentedEnvVars.keys()) {
    if (!codeEnvVars.has(varName)) {
      documentedButUnused.push(varName);
    }
  }

  if (documentedButUnused.length > 0) {
    logger.info(`Found ${documentedButUnused.length} documented but potentially unused environment variables (may be legacy):`);
    for (const varName of documentedButUnused) {
      logger.info(`  - ${varName}`);
    }
  }

  return issues;
}

/**
 * Main validation function
 */
async function validateDocsContent(): Promise<void> {
  logger.info('🔍 Validating documentation content...');

  const docFiles = await glob([
    'docs/**/*.md',
    'README.md',
    '.github/**/*.md',
    'app/**/*.md',
  ], { 
    cwd: ROOT,
    ignore: ['**/node_modules/**', '**/.next/**'],
  });

  const allIssues: ValidationIssue[] = [];

  // Validate each file
  for (const file of docFiles) {
    const filePath = path.join(ROOT, file);
    const content = readFileSync(filePath, 'utf8');

    // Check banned patterns
    const bannedIssues = checkBannedPatterns(content, file);
    allIssues.push(...bannedIssues);

    // Validate code blocks
    const codeBlocks = extractCodeBlocks(content, filePath);
    const codeBlockIssues = validateCodeBlocks(codeBlocks, file);
    allIssues.push(...codeBlockIssues);
  }

  // Validate environment variable documentation
  const envIssues = await validateEnvVarDocumentation();
  allIssues.push(...envIssues);

  // Report issues
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');

  if (errors.length > 0) {
    logger.error(`❌ Found ${errors.length} content validation errors:`);
    for (const issue of errors) {
      logger.error(`  ${issue.file}:${issue.line || '?'} - ${issue.issue}`);
    }
  }

  if (warnings.length > 0) {
    logger.warn(`⚠️  Found ${warnings.length} content validation warnings:`);
    for (const issue of warnings) {
      logger.warn(`  ${issue.file}:${issue.line || '?'} - ${issue.issue}`);
    }
  }

  if (errors.length > 0) {
    throw new Error('Documentation content validation failed');
  }

  if (warnings.length === 0 && errors.length === 0) {
    logger.info('✅ All documentation content validation passed');
  } else {
    logger.info(`✅ Documentation content validation completed (${warnings.length} warnings, ${errors.length} errors)`);
  }
}

// Run when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '');
if (isMainModule || process.argv[1]?.includes('validate-docs-content')) {
  validateDocsContent().catch((error) => {
    logger.error('Validation failed:');
    console.error(error);
    process.exit(1);
  });
}

export { validateDocsContent };

