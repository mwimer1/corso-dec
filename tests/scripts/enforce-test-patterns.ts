#!/usr/bin/env tsx
/**
 * @fileoverview Test pattern enforcement script
 * @description Validates test file naming, request patterns, and mock usage
 * 
 * Rules enforced:
 * 1. DOM component tests must be named *.dom.test.tsx
 * 2. API route tests must use new Request(...) and JSON.stringify(body)
 * 3. Disallow direct vi.mock('@clerk/nextjs/server') when centralized helper exists
 * 
 * Usage:
 *   pnpm tsx tests/scripts/enforce-test-patterns.ts
 * 
 * Exit codes:
 *   0 - All patterns valid
 *   1 - Pattern violations found
 */

import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const TESTS_DIR = join(ROOT_DIR, 'tests');

interface Violation {
  file: string;
  rule: string;
  message: string;
  line?: number;
}

const violations: Violation[] = [];

/**
 * Check if a file path is an E2E test (Playwright smoke tests)
 * E2E tests have their own naming conventions and should be excluded from pattern enforcement
 */
function isE2ETest(file: string): boolean {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = file.replace(/\\/g, '/');
  // Check if file is in tests/e2e directory
  return normalizedPath.includes('tests/e2e/') || normalizedPath.includes('/e2e/');
}

/**
 * Recursively find all test files
 */
function findTestFiles(dir: string, extensions: string[] = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other common exclusions
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
        continue;
      }
      files.push(...findTestFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Check if file uses React Testing Library or DOM APIs
 */
function isDOMTest(content: string): boolean {
  const domIndicators = [
    '@testing-library/react',
    'render(',
    'screen.getBy',
    'fireEvent',
    'userEvent',
    'jsdom',
    'document.',
    'window.',
  ];
  
  return domIndicators.some(indicator => content.includes(indicator));
}

/**
 * Rule 1: DOM component tests must be named *.dom.test.tsx
 * Note: E2E tests (Playwright) are excluded as they use document. in page.evaluate()
 * which is different from actual DOM component tests.
 */
function checkDOMTestNaming(file: string, content: string): void {
  // Skip E2E tests (Playwright) - they use document. in page.evaluate() but aren't DOM component tests
  if (isE2ETest(file)) {
    return;
  }

  const isDOM = isDOMTest(content);
  const isDOMTestFile = file.endsWith('.dom.test.tsx');
  const isTestFile = file.match(/\.(test|spec)\.(ts|tsx)$/);

  if (isDOM && isTestFile && !isDOMTestFile) {
    violations.push({
      file: relative(ROOT_DIR, file),
      rule: 'DOM_TEST_NAMING',
      message: 'DOM component tests must be named *.dom.test.tsx',
      line: 1,
    });
  }
}

/**
 * Rule 2: API route tests must use new Request(...) and JSON.stringify(body)
 */
function checkAPIRequestPattern(file: string, content: string): void {
  // Skip E2E tests - they have their own conventions
  if (isE2ETest(file)) {
    return;
  }

  // Only check API route test files
  if (!file.includes('tests/api') && !file.includes('tests/chat') && !file.includes('tests/security')) {
    return;
  }

  // Skip if not a route test
  if (!file.match(/route.*\.test\.(ts|tsx)$/i) && !file.match(/api.*\.test\.(ts|tsx)$/i)) {
    return;
  }

  // Check for new Request usage
  const hasNewRequest = /new\s+Request\(/.test(content);
  
  // Check for JSON.stringify in body
  const hasJSONStringify = /JSON\.stringify/.test(content);
  
  // Check for anti-pattern: { json: async () => ... }
  const hasJsonAsyncPattern = /\{\s*json:\s*async\s*\(\)/.test(content);

  if (hasJsonAsyncPattern) {
    violations.push({
      file: relative(ROOT_DIR, file),
      rule: 'API_REQUEST_PATTERN',
      message: 'API route tests must use new Request(...) with JSON.stringify(body), not { json: async () => ... } objects',
      line: content.split('\n').findIndex(line => /\{\s*json:\s*async/.test(line)) + 1,
    });
  }

  // If using Request, should also use JSON.stringify for body
  if (hasNewRequest && !hasJSONStringify && /body:\s*[^,}]+\s*[,}]/.test(content)) {
    const bodyMatch = content.match(/body:\s*([^,}]+)/);
    if (bodyMatch && !bodyMatch[1].includes('JSON.stringify')) {
      violations.push({
        file: relative(ROOT_DIR, file),
        rule: 'API_REQUEST_PATTERN',
        message: 'API route tests using new Request() must use JSON.stringify() for request body',
        line: content.split('\n').findIndex((line, idx) => 
          line.includes('new Request') && idx < content.split('\n').length - 10
        ) + 1,
      });
    }
  }
}

/**
 * Rule 3: Disallow direct vi.mock('@clerk/nextjs/server') when centralized helper exists
 */
function checkClerkMockUsage(file: string, content: string): void {
  // Skip E2E tests - they use Playwright, not Vitest mocks
  if (isE2ETest(file)) {
    return;
  }

  // Skip the centralized mock helper itself
  if (file.includes('tests/support/mocks/clerk.ts')) {
    return;
  }

  // Check for direct vi.mock('@clerk/nextjs/server')
  const directMockPattern = /vi\.mock\(['"]@clerk\/nextjs\/server['"]/;
  if (directMockPattern.test(content)) {
    // Check if centralized helper is imported
    const hasCentralizedHelper = /from\s+['"]@\/tests\/support\/mocks['"]/.test(content) ||
                                 /from\s+['"]@\/tests\/support\/mocks\/clerk['"]/.test(content) ||
                                 /mockClerkAuth/.test(content);

    if (!hasCentralizedHelper) {
      const lineNumber = content.split('\n').findIndex(line => directMockPattern.test(line)) + 1;
      violations.push({
        file: relative(ROOT_DIR, file),
        rule: 'CLERK_MOCK_USAGE',
        message: 'Use centralized mockClerkAuth helper from @/tests/support/mocks instead of direct vi.mock(\'@clerk/nextjs/server\')',
        line: lineNumber,
      });
    }
  }
}

/**
 * Main enforcement function
 */
function enforcePatterns(): void {
  console.log('🔍 Enforcing test patterns...\n');

  const testFiles = findTestFiles(TESTS_DIR);
  
  for (const file of testFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      checkDOMTestNaming(file, content);
      checkAPIRequestPattern(file, content);
      checkClerkMockUsage(file, content);
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  if (violations.length === 0) {
    console.log('✅ All test patterns are valid!\n');
    process.exit(0);
  } else {
    console.error(`❌ Found ${violations.length} pattern violation(s):\n`);
    
    // Group by rule
    const byRule = violations.reduce((acc, v) => {
      if (!acc[v.rule]) acc[v.rule] = [];
      acc[v.rule].push(v);
      return acc;
    }, {} as Record<string, Violation[]>);

    for (const [rule, ruleViolations] of Object.entries(byRule)) {
      console.error(`\n📋 Rule: ${rule}`);
      console.error('─'.repeat(60));
      
      for (const violation of ruleViolations) {
        console.error(`\n  File: ${violation.file}`);
        if (violation.line) {
          console.error(`  Line: ${violation.line}`);
        }
        console.error(`  Issue: ${violation.message}`);
        console.error(`\n  How to fix:`);
        
        if (rule === 'DOM_TEST_NAMING') {
          console.error(`    - Rename file to *.dom.test.tsx`);
          console.error(`    - Example: component.test.tsx → component.dom.test.tsx`);
        } else if (rule === 'API_REQUEST_PATTERN') {
          console.error(`    - Use: new Request(url, { method: 'POST', body: JSON.stringify(data) })`);
          console.error(`    - Avoid: { json: async () => data } objects`);
        } else if (rule === 'CLERK_MOCK_USAGE') {
          console.error(`    - Remove: vi.mock('@clerk/nextjs/server', ...)`);
          console.error(`    - Add: import { mockClerkAuth } from '@/tests/support/mocks'`);
          console.error(`    - Use: mockClerkAuth.setup({ userId: '...' }) in beforeEach`);
        }
      }
    }
    
    console.error('\n');
    process.exit(1);
  }
}

// Run if executed directly (tsx/pnpm tsx execution)
const isMainModule = process.argv[1]?.includes('enforce-test-patterns') ||
                     import.meta.url.endsWith('enforce-test-patterns.ts');

if (isMainModule) {
  enforcePatterns();
}

export { enforcePatterns };
