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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

interface ValidationIssue {
  file: string;
  line?: number;
  issue: string;
  severity: 'error' | 'warning';
}

interface CodeBlock {
  language?: string;
  content: string;
  startLine: number;
}

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};

/**
 * Extract code blocks from markdown content
 */
function extractCodeBlocks(content: string, filePath: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentBlock: { language?: string | undefined; content: string[]; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const codeBlockStart = /^```(\w+)?/.exec(line);
    
    if (codeBlockStart && !inCodeBlock) {
      inCodeBlock = true;
      currentBlock = {
        ...(codeBlockStart[1] ? { language: codeBlockStart[1] } : {}),
        content: [],
        startLine: i + 1,
      };
    } else if (line.trim() === '```' && inCodeBlock && currentBlock) {
      inCodeBlock = false;
      blocks.push({
        ...(currentBlock.language ? { language: currentBlock.language } : {}),
        content: currentBlock.content.join('\n'),
        startLine: currentBlock.startLine,
      });
      currentBlock = null;
    } else if (inCodeBlock && currentBlock) {
      currentBlock.content.push(line);
    }
  }

  return blocks;
}

/**
 * Check for banned patterns in documentation
 */
function checkBannedPatterns(content: string, filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = content.split('\n');
  
  // Track code blocks and whether they're code references (showing actual codebase code)
  const codeBlockRanges: Array<{ start: number; end: number; isCodeReference: boolean }> = [];
  let inCodeBlock = false;
  let codeBlockStart = -1;
  let isCodeReference = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Match code block start: ```language or ```startLine:endLine:filepath (code reference)
    // Code reference format: ```16:25:lib/vendors/ag-grid.client.ts (no language tag, starts with numbers)
    const isCodeRefStart = /^```\d+:\d+:[^\s]+$/.test(line.trim());
    const isRegularCodeBlock = /^```[\w:./-]*$/.test(line.trim());
    
    if ((isCodeRefStart || isRegularCodeBlock) && !inCodeBlock) {
      inCodeBlock = true;
      codeBlockStart = i;
      // Check if it's a code reference format: ```startLine:endLine:filepath
      isCodeReference = isCodeRefStart;
    } else if (line.trim() === '```' && inCodeBlock) {
      codeBlockRanges.push({ start: codeBlockStart, end: i, isCodeReference });
      inCodeBlock = false;
      isCodeReference = false;
    }
  }
  
  // Also check for evidence examples in audit docs (lines mentioning file paths with line numbers)
  const hasEvidenceExamples = lines.some((line, idx) => {
    if (!filePath.includes('audits/')) return false;
    // Pattern: "lib/path/file.ts: line ~123:" or "lib/path/file.ts: line ~123:"
    return /lib\/[^\s]+:\s*line\s*~?\d+/.test(line) || 
           (line.includes('Evidence examples') && idx < 10);
  });
  
  // Helper to check if a line is in a code reference block
  const isInCodeReference = (lineNum: number): boolean => {
    return codeBlockRanges.some(range => 
      lineNum >= range.start && lineNum <= range.end && range.isCodeReference
    );
  };

  // Banned patterns with their error messages
  const bannedPatterns = [
    {
      pattern: /process\.env\[/g,
      message: 'Direct process.env usage in documentation. Use getEnv() or publicEnv patterns instead.',
      severity: 'error' as const,
      // Allow in code examples that show the wrong way
      allowInComments: true,
    },
    {
      pattern: /process\.env\.([A-Z_][A-Z0-9_]*)/g,
      message: 'Direct process.env property access in documentation. Use getEnv() or publicEnv patterns instead.',
      severity: 'error' as const,
      allowInComments: true,
    },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    // Compute context once per line (not per pattern)
    const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
    const nextLines = lines.slice(i + 1, Math.min(lines.length, i + 5)).join('\n');
    const context = prevLines + '\n' + line + '\n' + nextLines;
    
    // Check for evidence examples: "lib/path/file.ts: line ~123:" or "- lib/path/file.ts: line ~44:"
    // Also check for lines that are part of evidence sections (e.g., "Evidence examples (from scan)")
    // This check applies to all files, but is especially important for audit docs
    // The pattern matches: "lib/path/file.ts: line ~44:" or "lib/path/file.ts: line 44:"
    // It may be indented and may have backticks around the code
    const isEvidenceLine = /lib\/[^\s]+:\s*line\s*~?\d+/.test(line) && line.includes('process.env');
    const isInEvidenceSection = filePath.includes('audits/') && 
                                (prevLines.includes('Evidence examples') || 
                                 prevLines.includes('Evidence examples (from scan)') ||
                                 prevLines.includes('from scan') ||
                                 context.includes('Evidence examples'));
    
    // Skip if it's in audit documents showing evidence (legitimate for audit docs)
    // Audit docs often show actual code from the codebase for review purposes
    // Early exit for evidence lines in audit docs (before pattern test)
    // Also skip if the line is a list item (- or *) that contains process.env and is in an evidence section
    // Normalize path separators for Windows compatibility
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.includes('audits/')) {
      // Check if the line matches the evidence pattern (lib/path: line ~N:)
      // This is the most reliable check - if it matches this pattern, it's definitely evidence
      const matchesEvidencePattern = /lib\/[^\s]+:\s*line\s*~?\d+:/.test(line);
      
      // Check if it's a list item in an evidence section (most common case)
      // The line may contain process.env inside backticks (code examples)
      const isListItemInEvidence = (line.trim().startsWith('-') || line.trim().startsWith('*')) && 
                                    line.includes('process.env') && 
                                    (prevLines.includes('Evidence examples') || 
                                     prevLines.includes('Evidence examples (from scan)') ||
                                     prevLines.includes('from scan'));
      
      // If any of these conditions are true, skip this line
      // Note: matchesEvidencePattern is checked first as it's the most reliable
      if (matchesEvidencePattern || isEvidenceLine || isInEvidenceSection || isListItemInEvidence) {
        continue; // Skip to next line, don't check patterns
      }
    }

    for (const { pattern, message, severity, allowInComments } of bannedPatterns) {
      // Skip if it's in a comment explaining the wrong way
      if (allowInComments && (line.includes('❌') || line.includes('INCORRECT') || line.includes('// ❌') || line.includes('// ❌'))) {
        continue;
      }

      // Check if marked as incorrect on same line or previous line
      const isMarkedIncorrect = line.includes('❌') || prevLines.includes('❌ INCORRECT') || 
                                prevLines.includes('❌ OLD') || prevLines.includes('// ❌') ||
                                line.includes('INCORRECT') || prevLines.includes('INCORRECT');
      
      if (prevLines.includes('Don\'t Do This') || prevLines.includes('❌ Don\'t Do This') || prevLines.includes('### ❌') || 
          prevLines.includes('Anti-Pattern') || prevLines.includes('Common Anti-Patterns') || isMarkedIncorrect) {
        continue;
      }

      // Skip if it's in test setup examples (beforeEach, afterEach, test setup)
      if (context.includes('beforeEach') || context.includes('afterEach') || context.includes('test setup') || 
          context.includes('Test setup') || context.includes('vi.resetModules') || context.includes('Test with intentional')) {
        continue;
      }

      // Skip if it's in config file examples (next.config, webpack.config, etc.)
      if (context.includes('next.config') || context.includes('webpack.config') || context.includes('config file') ||
          context.includes('nextConfig') || context.includes('Option C: Conditional Webpack')) {
        continue;
      }

      // Skip if it's in "Allowed Exceptions" section (explicitly documented exceptions)
      if (context.includes('Allowed Exceptions') || context.includes('Build-time Optimization') ||
          context.includes('Dev-only Logging') || context.includes('Runtime Compatibility') ||
          context.includes('NODE_ENV check allowed')) {
        continue;
      }

      // Skip if it's in "Before (Legacy)" migration examples
      if (context.includes('Before (Legacy') || context.includes('❌ OLD:') || context.includes('Legacy Direct Access')) {
        continue;
      }

      // Skip if it's in a code reference block (showing actual code from codebase)
      if (isInCodeReference(lineNum)) {
        continue;
      }
      
      if (filePath.includes('audits/')) {
        // Check if it's showing code from a specific file (indicated by file path references)
        // Code references use format: ```startLine:endLine:filepath
        const hasCodeReference = /```\d+:\d+:[^\s]+/.test(prevLines) || 
                                 /```\d+:\d+:[^\s]+/.test(nextLines) ||
                                 /```\d+:\d+:[^\s]+/.test(context);
        const hasEvidencePattern = /lib\/[^\s]+:\s*line\s*~?\d+/.test(context) ||
                                  prevLines.includes('Evidence examples') ||
                                  prevLines.includes('from scan') ||
                                  context.includes('Evidence examples (from scan)') ||
                                  // List items showing evidence: "- lib/path/file.ts: line ~44: `code`"
                                  isEvidenceLine ||
                                  // Any line after "Evidence examples" section header (within 10 lines)
                                  (prevLines.includes('Evidence examples') && line.includes('process.env'));
        // Check if line is in a code block that starts with a code reference
        const isInCodeRefBlock = isInCodeReference(lineNum);
        // Check if we're inside any code block in an audit doc (audit docs show actual code)
        const isInAnyCodeBlock = codeBlockRanges.some(range => 
          lineNum >= range.start && lineNum <= range.end
        );
        // In audit docs, skip if:
        // 1. Line contains evidence pattern (file path with line number)
        // 2. Line is in any code block
        // 3. Context includes file paths or code references
        if (isEvidenceLine || isInAnyCodeBlock || hasCodeReference || hasEvidencePattern || isInCodeRefBlock ||
            context.includes('lib/') || context.includes('components/') || context.includes('app/')) {
          continue;
        }
      }

      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: message,
          severity,
        });
      }
    }
  }

  return issues;
}

/**
 * Validate TypeScript/JavaScript code blocks
 */
function validateCodeBlocks(blocks: CodeBlock[], filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

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
        issues.push({
          file: filePath,
          line: block.startLine,
          issue: 'Code block contains direct process.env usage without indicating it\'s the wrong pattern',
          severity: 'warning',
        });
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
    if (varName.startsWith('_') || varName === 'NODE_ENV' || varName === 'NEXT_RUNTIME' || varName === 'NEXT_PHASE') {
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

