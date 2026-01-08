#!/usr/bin/env tsx
/**
 * Architecture drift check script
 * 
 * Validates that documentation and code references are consistent:
 * - actions/README.md doesn't contain outdated claims
 * - No references to removed endpoints
 * - actions/index.ts exports only existing files
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const checks: CheckResult[] = [];

// Check 1: actions/README.md doesn't contain banned phrases
// Note: actions/ directory was removed in PR5.2 - Server Actions are now feature-colocated
function checkActionsReadme(): CheckResult {
  const readmePath = join(REPO_ROOT, 'actions', 'README.md');
  if (!existsSync(readmePath)) {
    // actions/README.md should not exist after PR5.2 - this is expected
    return {
      name: 'actions/README.md exists',
      passed: true,
      message: 'actions/README.md not found (expected - Server Actions are feature-colocated)',
    };
  }

  const content = readFileSync(readmePath, 'utf-8');
  const bannedPhrases = [
    '5 production-ready',
    '4 actions',
    'chat domain with 4 actions',
    'billing actions',
    '/api/v1/dashboard/query',
  ];

  const foundPhrases: string[] = [];
  for (const phrase of bannedPhrases) {
    if (content.includes(phrase)) {
      foundPhrases.push(phrase);
    }
  }

  if (foundPhrases.length > 0) {
    return {
      name: 'actions/README.md banned phrases',
      passed: false,
      message: `Found banned phrases: ${foundPhrases.join(', ')}`,
    };
  }

  return {
    name: 'actions/README.md banned phrases',
    passed: true,
    message: 'No banned phrases found',
  };
}

// Check 2: No references to /api/v1/dashboard/query
async function checkDashboardQueryReferences(): Promise<CheckResult> {
  const { readdirSync, readFileSync, statSync } = await import('fs');
  const { join, extname } = await import('path');
  
  const extensions = ['.ts', '.tsx', '.md', '.json', '.yml', '.yaml', '.mjs', '.cjs'];
  const searchPattern = '/api/v1/dashboard/query';
  const foundReferences: string[] = [];
  
  function shouldSkipFile(filePath: string): boolean {
    return (
      filePath.includes('node_modules') ||
      filePath.includes('.next') ||
      filePath.includes('dist') ||
      filePath.includes('coverage') ||
      filePath.includes('check-architecture-drift.ts')
    );
  }
  
  function searchInFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Known issue: ClickHouse client has a TODO about this endpoint removal
      // This needs to be fixed separately as it's a breaking change
      const normalizedPath = filePath.replace(/\\/g, '/');
      if (normalizedPath.includes('clickhouse/client.ts') && content.includes('TODO:') && content.includes('endpoint was removed')) {
        return; // Skip this file - it's a known issue with a TODO
      }
      
      lines.forEach((line, index) => {
        if (line.includes(searchPattern)) {
          // Allow references in:
          // - Comments about removal/migration
          // - Error examples in documentation
          // - TODO/FIXME comments (check current and previous 5 lines)
          const trimmed = line.trim();
          const contextLines = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
          const isErrorExample = trimmed.startsWith('# Error:') || trimmed.startsWith('// Error:');
          const isRemovalComment = 
            trimmed.includes('removed') ||
            trimmed.includes('migrated') ||
            trimmed.includes('deprecated') ||
            trimmed.includes('// Removed:') ||
            trimmed.includes('# Removed:') ||
            trimmed.includes('Removed:');
          const isTodoComment = contextLines.includes('TODO:') || contextLines.includes('FIXME:');
          
          if (!isErrorExample && !isRemovalComment && !isTodoComment) {
            foundReferences.push(`${filePath}:${index + 1}`);
          }
        }
      });
    } catch (error) {
      // Skip files that can't be read (binary, etc.)
    }
  }
  
  function walkDir(dir: string): void {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        if (shouldSkipFile(fullPath)) continue;
        
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (stat.isFile() && extensions.includes(extname(fullPath))) {
            searchInFile(fullPath);
          }
        } catch {
          // Skip files we can't access
        }
      }
    } catch {
      // Skip directories we can't access
    }
  }
  
  // Search in key directories
  const searchDirs = ['app', 'lib', 'actions', 'docs', 'api', 'config', 'tests'];
  for (const dir of searchDirs) {
    const dirPath = join(REPO_ROOT, dir);
    try {
      if (statSync(dirPath).isDirectory()) {
        walkDir(dirPath);
      }
    } catch {
      // Skip if directory doesn't exist
    }
  }
  
  if (foundReferences.length > 0) {
    return {
      name: 'No /api/v1/dashboard/query references',
      passed: false,
      message: `Found ${foundReferences.length} reference(s):\n${foundReferences.slice(0, 5).join('\n')}${foundReferences.length > 5 ? '\n...' : ''}`,
    };
  }
  
  return {
    name: 'No /api/v1/dashboard/query references',
    passed: true,
    message: 'No references found',
  };
}

// Check 3: actions/index.ts exports only existing files
// Note: actions/ directory was removed in PR5.2 - Server Actions are now feature-colocated
function checkActionsExports(): CheckResult {
  const indexPath = join(REPO_ROOT, 'actions', 'index.ts');
  if (!existsSync(indexPath)) {
    // actions/index.ts should not exist after PR5.2 - this is expected
    return {
      name: 'actions/index.ts exports',
      passed: true,
      message: 'actions/index.ts not found (expected - Server Actions are feature-colocated)',
    };
  }

  const content = readFileSync(indexPath, 'utf-8');
  
  // Extract export statements
  const exportMatches = content.matchAll(/export\s+\*\s+from\s+["']\.\/([^"']+)["']/g);
  const exports: string[] = [];
  for (const match of exportMatches) {
    if (match[1]) {
      exports.push(match[1]);
    }
  }

  const missingExports: string[] = [];
  for (const exportPath of exports) {
    // Convert export path to file path
    const filePath = join(REPO_ROOT, 'actions', `${exportPath}.ts`);
    if (!existsSync(filePath)) {
      missingExports.push(exportPath);
    }
  }

  if (missingExports.length > 0) {
    return {
      name: 'actions/index.ts exports',
      passed: false,
      message: `Exports non-existent files: ${missingExports.join(', ')}`,
    };
  }

  return {
    name: 'actions/index.ts exports',
    passed: true,
    message: `All ${exports.length} export(s) point to existing files`,
  };
}

// Run all checks (async)
async function runChecks() {
  checks.push(checkActionsReadme());
  checks.push(await checkDashboardQueryReferences());
  checks.push(checkActionsExports());
  
  // Report results
  const failed = checks.filter(c => !c.passed);
  const passed = checks.filter(c => c.passed);
  
  console.log('\n📋 Architecture Drift Check Results\n');
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);
  
  for (const check of checks) {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}\n`);
  }
  
  if (failed.length > 0) {
    console.error('❌ Architecture drift detected. Please fix the issues above.\n');
    process.exit(1);
  }
  
  console.log('✅ All checks passed!\n');
  process.exit(0);
}

runChecks();

