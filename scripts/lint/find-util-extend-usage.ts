#!/usr/bin/env tsx
/**
 * Script to find packages in node_modules that use util._extend
 * This helps identify the source of DEP0060 deprecation warnings
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface Finding {
  package: string;
  file: string;
  line: number;
  content: string;
}

const findings: Finding[] = [];
const nodeModulesPath = join(process.cwd(), 'node_modules');

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
        lowerLine.includes('_extend(') && lowerLine.includes('util')
      ) {
        findings.push({
          package: packageName,
          file: filePath.replace(process.cwd() + '/', ''),
          line: index + 1,
          content: line.trim(),
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
    process.exit(1);
  }
}

// Main execution
console.log('Scanning node_modules for util._extend usage...\n');
findPackages();

if (findings.length === 0) {
  console.log('✅ No util._extend usage found in node_modules');
  process.exit(0);
}

console.log(`\n⚠️  Found ${findings.length} occurrence(s) of util._extend:\n`);

// Group by package
const byPackage = new Map<string, Finding[]>();
for (const finding of findings) {
  if (!byPackage.has(finding.package)) {
    byPackage.set(finding.package, []);
  }
  byPackage.get(finding.package)!.push(finding);
}

for (const [pkg, pkgFindings] of byPackage.entries()) {
  console.log(`\n📦 Package: ${pkg}`);
  for (const finding of pkgFindings) {
    console.log(`   ${finding.file}:${finding.line}`);
    console.log(`   ${finding.content}`);
  }
}

console.log('\n');
process.exit(findings.length > 0 ? 1 : 0);
