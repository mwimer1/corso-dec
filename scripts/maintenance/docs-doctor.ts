#!/usr/bin/env tsx
/**
 * @fileoverview Documentation health check and summary
 * @description Provides a comprehensive health summary of documentation
 */

import { glob } from 'glob';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseMd, normalizeDate } from './_utils/frontmatter';

const ARGS = process.argv.slice(2);
const FULL = ARGS.includes('--full');

interface HealthSummary {
  totalReadmes: number;
  staleDocs: Array<{ file: string; age: number; lastUpdated: string }>;
  missingFrontmatter: Array<{ file: string; missingFields: string[] }>;
  brokenLinks: number;
  driftIssues: number;
}

/**
 * Count total README files
 */
async function countReadmes(): Promise<number> {
  const files = await glob('**/README.md', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  });
  return files.length;
}

/**
 * Find stale documentation (>90 days old)
 */
async function findStaleDocs(): Promise<Array<{ file: string; age: number; lastUpdated: string }>> {
  const files = await glob('docs/**/*.md', {
    ignore: ['**/node_modules/**'],
  });
  
  const cutoff = 90 * 24 * 60 * 60 * 1000; // 90 days
  const now = Date.now();
  const stale: Array<{ file: string; age: number; lastUpdated: string }> = [];
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const parsed = parseMd(content);
      const dateStr = normalizeDate(parsed.data?.['last_updated']);
      
      if (dateStr) {
        const age = now - new Date(dateStr).getTime();
        if (age > cutoff) {
          stale.push({
            file: path.relative(process.cwd(), file),
            age: Math.floor(age / (24 * 60 * 60 * 1000)), // days
            lastUpdated: dateStr,
          });
        }
      }
    } catch {
      // Skip files we can't read
    }
  }
  
  return stale;
}

/**
 * Find missing frontmatter fields
 */
async function findMissingFrontmatter(): Promise<Array<{ file: string; missingFields: string[] }>> {
  const files = await glob('docs/**/*.md', {
    ignore: ['**/node_modules/**'],
  });
  
  const requiredFields = ['title', 'description', 'last_updated', 'category', 'status'];
  const issues: Array<{ file: string; missingFields: string[] }> = [];
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const parsed = parseMd(content);
      
      if (!parsed.hasFrontmatter) {
        issues.push({
          file: path.relative(process.cwd(), file),
          missingFields: requiredFields,
        });
        continue;
      }
      
      const missing: string[] = [];
      for (const field of requiredFields) {
        if (!parsed.data?.[field]) {
          missing.push(field);
        }
      }
      
      if (missing.length > 0) {
        issues.push({
          file: path.relative(process.cwd(), file),
          missingFields: missing,
        });
      }
    } catch {
      // Skip files we can't read
    }
  }
  
  return issues;
}

/**
 * Count broken links (quick check, not full validation)
 */
async function countBrokenLinks(): Promise<number> {
  // Quick check: count filesystem links that don't resolve
  // For full validation, use pnpm docs:validate
  const files = await glob('docs/**/*.md', {
    ignore: ['**/node_modules/**'],
  });
  
  let brokenCount = 0;
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      
      for (const link of links) {
        const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(link);
        if (match?.[2]) {
          const target = match[2];
          // Skip external links, anchors, mailto
          if (/^(https?:)?\/\//.test(target) || target.startsWith('#') || target.startsWith('mailto:') || target.startsWith('mdc:')) {
            continue;
          }
          
          // Resolve relative path
          const resolved = path.resolve(path.dirname(file), target.split('#')[0]?.split('?')[0] || '');
          if (!existsSync(resolved)) {
            brokenCount++;
          }
        }
      }
    } catch {
      // Skip files we can't read
    }
  }
  
  return brokenCount;
}

/**
 * Check architecture drift
 */
function checkDrift(): number {
  try {
    const result = execSync('pnpm check:drift', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    // Count failures (lines with ❌)
    const failures = result.split('\n').filter(line => line.includes('❌')).length;
    return failures;
  } catch {
    // If drift check fails, assume there are issues
    return 1;
  }
}

/**
 * Generate health summary
 */
async function generateSummary(): Promise<HealthSummary> {
  console.log('🏥 Checking documentation health...\n');
  
  const totalReadmes = await countReadmes();
  console.log(`📊 Counting READMEs... (${totalReadmes} found)`);
  
  const staleDocs = await findStaleDocs();
  console.log(`📅 Checking freshness... (${staleDocs.length} stale)`);
  
  const missingFrontmatter = await findMissingFrontmatter();
  console.log(`📝 Checking frontmatter... (${missingFrontmatter.length} with missing fields)`);
  
  let brokenLinks = 0;
  if (FULL) {
    brokenLinks = await countBrokenLinks();
    console.log(`🔗 Checking links... (${brokenLinks} broken)`);
  } else {
    console.log(`🔗 Skipping link check (use --full for detailed link validation)`);
  }
  
  const driftIssues = checkDrift();
  console.log(`🏗️  Checking architecture drift... (${driftIssues} issues)\n`);
  
  return {
    totalReadmes,
    staleDocs,
    missingFrontmatter,
    brokenLinks,
    driftIssues,
  };
}

/**
 * Print summary report
 */
function printSummary(summary: HealthSummary): void {
  console.log('📋 Documentation Health Summary\n');
  console.log(`📚 Total READMEs: ${summary.totalReadmes}`);
  console.log(`📅 Stale docs (>90 days): ${summary.staleDocs.length}`);
  console.log(`📝 Missing frontmatter: ${summary.missingFrontmatter.length}`);
  if (FULL) {
    console.log(`🔗 Broken links: ${summary.brokenLinks}`);
  }
  console.log(`🏗️  Architecture drift issues: ${summary.driftIssues}\n`);
  
  // Show details if there are issues
  if (summary.staleDocs.length > 0) {
    console.log('⚠️  Stale Documentation (>90 days):');
    for (const doc of summary.staleDocs.slice(0, 10)) {
      console.log(`   - ${doc.file} (${doc.age} days old, last updated: ${doc.lastUpdated})`);
    }
    if (summary.staleDocs.length > 10) {
      console.log(`   ... and ${summary.staleDocs.length - 10} more`);
    }
    console.log('');
  }
  
  if (summary.missingFrontmatter.length > 0) {
    console.log('⚠️  Missing Frontmatter Fields:');
    for (const issue of summary.missingFrontmatter.slice(0, 10)) {
      console.log(`   - ${issue.file} (missing: ${issue.missingFields.join(', ')})`);
    }
    if (summary.missingFrontmatter.length > 10) {
      console.log(`   ... and ${summary.missingFrontmatter.length - 10} more`);
    }
    console.log('');
  }
  
  if (FULL && summary.brokenLinks > 0) {
    console.log(`⚠️  Broken Links: ${summary.brokenLinks} found`);
    console.log('   Run `pnpm docs:validate` for detailed link validation\n');
  }
  
  if (summary.driftIssues > 0) {
    console.log('⚠️  Architecture Drift: Issues detected');
    console.log('   Run `pnpm check:drift` for details\n');
  }
  
  // Overall health
  const totalIssues = summary.staleDocs.length + summary.missingFrontmatter.length + 
                      (FULL ? summary.brokenLinks : 0) + summary.driftIssues;
  
  if (totalIssues === 0) {
    console.log('✅ Documentation is healthy!');
  } else {
    console.log(`⚠️  Found ${totalIssues} issue(s) - see details above`);
    console.log('\n💡 To fix:');
    console.log('   - Run `pnpm docs:validate` for full validation');
    console.log('   - Run `pnpm docs:refresh` to normalize frontmatter');
    console.log('   - Run `pnpm check:drift` to fix architecture drift');
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const summary = await generateSummary();
    printSummary(summary);
    
    // Exit with error code if there are issues
    const totalIssues = summary.staleDocs.length + summary.missingFrontmatter.length + 
                        (FULL ? summary.brokenLinks : 0) + summary.driftIssues;
    process.exit(totalIssues > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Docs doctor failed:', error);
    process.exit(1);
  }
}

void main();
