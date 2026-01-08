#!/usr/bin/env tsx
/**
 * Regression check for util._extend deprecation warnings
 * 
 * Scans node_modules for packages using util._extend and fails if new packages
 * are found that aren't in the allowlist.
 * 
 * Usage:
 *   pnpm lint:deprecations
 * 
 * To update allowlist:
 *   1. Run this script to see current findings
 *   2. Copy findings to scripts/lint/deprecations-util-extend.allowlist.json
 *   3. Re-run to verify
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface Finding {
  package: string;
  file: string;
  line: number;
  content: string;
}

interface AllowlistEntry {
  package: string;
  file: string;
  reason?: string;
}

const findings: Finding[] = [];
const nodeModulesPath = join(process.cwd(), 'node_modules');
const allowlistPath = join(process.cwd(), 'scripts/lint/deprecations-util-extend.allowlist.json');

function scanFile(filePath: string, packageName: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes('util._extend') ||
        lowerLine.includes("require('util')._extend") ||
        lowerLine.includes('require("util")._extend') ||
        lowerLine.includes('util[\'_extend\']') ||
        lowerLine.includes('util["_extend"]') ||
        (lowerLine.includes('_extend(') && lowerLine.includes('util'))
      ) {
        findings.push({
          package: packageName,
          file: filePath.replace(process.cwd() + '/', ''),
          line: index + 1,
          content: line.trim().substring(0, 100), // Truncate long lines
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read (binary, permissions, etc.)
  }
}

function scanDirectory(dirPath: string, packageName: string, depth = 0): void {
  if (depth > 5) return; // Limit recursion depth
  
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      
      try {
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip certain directories
          if (entry === '.git' || entry === 'node_modules' || entry.startsWith('.')) {
            continue;
          }
          scanDirectory(fullPath, packageName, depth + 1);
        } else if (stat.isFile() && (entry.endsWith('.js') || entry.endsWith('.ts'))) {
          scanFile(fullPath, packageName);
        }
      } catch {
        // Skip entries we can't access
      }
    }
  } catch {
    // Skip directories we can't access
  }
}

function findPackages(): void {
  try {
    const packages = readdirSync(nodeModulesPath);
    
    for (const pkg of packages) {
      if (pkg.startsWith('.')) continue;
      
      const pkgPath = join(nodeModulesPath, pkg);
      
      try {
        const stat = statSync(pkgPath);
        if (stat.isDirectory()) {
          // Check if it's a scoped package
          if (pkg.startsWith('@')) {
            const scopedPackages = readdirSync(pkgPath);
            for (const scopedPkg of scopedPackages) {
              const scopedPkgPath = join(pkgPath, scopedPkg);
              try {
                if (statSync(scopedPkgPath).isDirectory()) {
                  scanDirectory(scopedPkgPath, `${pkg}/${scopedPkg}`);
                }
              } catch {
                // Skip
              }
            }
          } else {
            scanDirectory(pkgPath, pkg);
          }
        }
      } catch {
        // Skip packages we can't access
      }
    }
  } catch (error) {
    console.error('Error scanning node_modules:', error);
    process.exitCode = 1;
    return;
  }
}

function loadAllowlist(): AllowlistEntry[] {
  if (!existsSync(allowlistPath)) {
    return [];
  }
  
  try {
    const content = readFileSync(allowlistPath, 'utf-8');
    return JSON.parse(content) as AllowlistEntry[];
  } catch (error) {
    console.error(`Error reading allowlist: ${error}`);
    return [];
  }
}

function isAllowed(finding: Finding, allowlist: AllowlistEntry[]): boolean {
  return allowlist.some((entry) => {
    if (entry.package !== finding.package) return false;
    
    // Normalize paths for comparison (handle both absolute and relative)
    const findingFile = finding.file.replace(/\\/g, '/').toLowerCase();
    const entryFile = entry.file.replace(/\\/g, '/').toLowerCase();
    
    if (entryFile === '*') return true;
    if (entryFile === findingFile) return true;
    
    // Check if finding file ends with entry file (for relative paths)
    if (findingFile.endsWith(entryFile)) return true;
    
    // Check if entry file is a substring (for partial matches)
    if (findingFile.includes(entryFile)) return true;
    
    return false;
  });
}

function main() {
  // Main execution
  console.log('Scanning node_modules for util._extend usage...\n');
  findPackages();

  if (findings.length === 0) {
    console.log('✅ No util._extend usage found in node_modules');
    return;
  }

  const allowlist = loadAllowlist();
  const unallowedFindings = findings.filter((f) => !isAllowed(f, allowlist));

  if (unallowedFindings.length === 0) {
    console.log(`✅ All ${findings.length} util._extend occurrences are allowlisted\n`);
    
    // Show allowlisted findings for transparency
    const byPackage = new Map<string, Finding[]>();
    for (const finding of findings) {
      if (!byPackage.has(finding.package)) {
        byPackage.set(finding.package, []);
      }
      byPackage.get(finding.package)!.push(finding);
    }
    
    console.log('Allowlisted packages:');
    for (const [pkg, pkgFindings] of byPackage.entries()) {
      const entry = allowlist.find((e) => e.package === pkg);
      console.log(`  - ${pkg} (${pkgFindings.length} occurrence(s))${entry?.reason ? ` - ${entry.reason}` : ''}`);
    }
    
    return;
  }

  // Fail with detailed output
  console.log(`\n❌ Found ${unallowedFindings.length} unallowlisted util._extend occurrence(s):\n`);

  // Group by package
  const byPackage = new Map<string, Finding[]>();
  for (const finding of unallowedFindings) {
    if (!byPackage.has(finding.package)) {
      byPackage.set(finding.package, []);
    }
    byPackage.get(finding.package)!.push(finding);
  }

  for (const [pkg, pkgFindings] of byPackage.entries()) {
    console.log(`\n📦 Package: ${pkg}`);
    for (const finding of pkgFindings.slice(0, 3)) {
      // Show first 3 occurrences per package
      console.log(`   ${finding.file}:${finding.line}`);
      console.log(`   ${finding.content}`);
    }
    if (pkgFindings.length > 3) {
      console.log(`   ... and ${pkgFindings.length - 3} more occurrence(s)`);
    }
  }

  console.log(`\n💡 To allowlist these findings:`);
  console.log(`   1. Create or update: ${allowlistPath}`);
  console.log(`   2. Add entries in format:`);
  console.log(`      [`);
  console.log(`        {`);
  console.log(`          "package": "package-name",`);
  console.log(`          "file": "path/to/file.js",`);
  console.log(`          "reason": "Optional reason for allowlisting"`);
  console.log(`        }`);
  console.log(`      ]`);
  console.log(`   3. Re-run this script to verify\n`);

  process.exitCode = 1;
}

main();
