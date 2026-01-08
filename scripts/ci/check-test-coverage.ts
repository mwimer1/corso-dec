#!/usr/bin/env tsx
/**
 * Coverage Watchdog Script
 * 
 * Ensures every domain in lib/ has corresponding tests in tests/unit/
 * Fails CI if new lib domains are added without test coverage.
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const PROJECT_ROOT = process.cwd();
const LIB_DIR = join(PROJECT_ROOT, 'lib');
const UNIT_TESTS_DIR = join(PROJECT_ROOT, 'tests', 'unit');

// Domains that are explicitly allowed to skip unit tests
const ALLOWED_EXEMPTIONS = new Set([
  'index.ts',        // Main barrel file
  'core.ts',         // Core barrel file  
  'core-client.ts',  // Client barrel file
  'core-server.ts',  // Server barrel file
  'api-client.ts',   // Simple API client utility
  'README.md',       // Documentation
]);

interface CoverageReport {
  coveredDomains: string[];
  missingCoverage: string[];
  exemptedDomains: string[];
  totalLibDomains: number;
  coveragePercentage: number;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function getLibDomains(): Promise<string[]> {
  try {
    const entries = await readdir(LIB_DIR);
    const domains: string[] = [];
    
    for (const entry of entries) {
      const entryPath = join(LIB_DIR, entry);
      if (await isDirectory(entryPath)) {
        domains.push(entry);
      }
    }
    
    return domains.sort();
  } catch (error) {
    console.error('Failed to read lib directory:', error);
    return [];
  }
}

async function getUnitTestDomains(): Promise<string[]> {
  try {
    const entries = await readdir(UNIT_TESTS_DIR);
    const domains: string[] = [];
    
    for (const entry of entries) {
      const entryPath = join(UNIT_TESTS_DIR, entry);
      if (await isDirectory(entryPath)) {
        domains.push(entry);
      }
    }
    
    return domains.sort();
  } catch (error) {
    console.error('Failed to read unit tests directory:', error);
    return [];
  }
}

async function generateCoverageReport(): Promise<CoverageReport> {
  const [libDomains, testDomains] = await Promise.all([
    getLibDomains(),
    getUnitTestDomains()
  ]);
  
  const testDomainSet = new Set(testDomains);
  const coveredDomains: string[] = [];
  const missingCoverage: string[] = [];
  const exemptedDomains: string[] = [];
  
  for (const domain of libDomains) {
    if (ALLOWED_EXEMPTIONS.has(domain)) {
      exemptedDomains.push(domain);
    } else if (testDomainSet.has(domain)) {
      coveredDomains.push(domain);
    } else {
      missingCoverage.push(domain);
    }
  }
  
  const totalLibDomains = libDomains.length - exemptedDomains.length;
  const coveragePercentage = totalLibDomains > 0 
    ? Math.round((coveredDomains.length / totalLibDomains) * 100) 
    : 100;
  
  return {
    coveredDomains,
    missingCoverage,
    exemptedDomains,
    totalLibDomains,
    coveragePercentage
  };
}

function printReport(report: CoverageReport): void {
  console.log('\n🧪 Test Coverage Watchdog Report');
  console.log('═'.repeat(40));
  
  console.log(`\n📊 Coverage Summary:`);
  console.log(`   Total lib domains: ${report.totalLibDomains}`);
  console.log(`   Covered domains:   ${report.coveredDomains.length}`);
  console.log(`   Missing coverage:  ${report.missingCoverage.length}`);
  console.log(`   Coverage:          ${report.coveragePercentage}%`);
  
  if (report.coveredDomains.length > 0) {
    console.log(`\n✅ Covered domains (${report.coveredDomains.length}):`);
    report.coveredDomains.forEach(domain => console.log(`   • ${domain}`));
  }
  
  if (report.exemptedDomains.length > 0) {
    console.log(`\n⚪ Exempted from coverage (${report.exemptedDomains.length}):`);
    report.exemptedDomains.forEach(domain => console.log(`   • ${domain}`));
  }
  
  if (report.missingCoverage.length > 0) {
    console.log(`\n❌ Missing test coverage (${report.missingCoverage.length}):`);
    report.missingCoverage.forEach(domain => {
      console.log(`   • lib/${domain}/ → tests/unit/${domain}/`);
    });
    
    console.log(`\n💡 To fix missing coverage:`);
    report.missingCoverage.forEach(domain => {
      console.log(`   - Unix/macOS:   mkdir -p tests/unit/${domain} && touch tests/unit/${domain}/${domain}.test.ts`);
      console.log(`   - Windows (PS): New-Item -ItemType Directory -Force tests/unit/${domain} ; New-Item -ItemType File -Force tests/unit/${domain}/${domain}.test.ts`);
    });
  }
}

async function main(): Promise<void> {
  const report = await generateCoverageReport();
  
  printReport(report);
  
  // Fail CI if there are domains without test coverage
  if (report.missingCoverage.length > 0) {
    console.log('\n🚨 Coverage check failed!');
    console.log('New lib domains must include unit tests.');
    console.log('Add smoke tests or update ALLOWED_EXEMPTIONS if appropriate.');
    process.exit(1);
  }
  
  console.log('\n✅ Coverage check passed!');
  console.log(`All ${report.totalLibDomains} lib domains have test coverage.`);
}

// Run the script
main().catch((error) => {
  console.error('Coverage check failed:', error);
  process.exit(1);
});

export { generateCoverageReport, type CoverageReport };

