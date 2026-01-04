#!/usr/bin/env tsx
/**
 * Variant Adoption Audit Script
 * 
 * Scans components/ui for components that define custom tv() variants
 * and flags potential opportunities to use shared variants via extend pattern.
 * 
 * Usage:
 *   pnpm audit:variant-adoption
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS_DIR = join(process.cwd(), 'components/ui');
const STYLES_DIR = join(process.cwd(), 'styles/ui');

interface AuditResult {
  file: string;
  hasCustomVariant: boolean;
  variantDefinition?: string;
  usesExtend?: boolean;
  potentialSharedVariant?: string;
}

function findCustomVariants(filePath: string): AuditResult {
  const content = readFileSync(filePath, 'utf-8');
  const result: AuditResult = {
    file: filePath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''),
    hasCustomVariant: false,
  };

  // Check for tv() definitions
  const tvPattern = /const\s+(\w+)\s*=\s*tv\s*\(/g;
  const matches = Array.from(content.matchAll(tvPattern));

  if (matches.length > 0) {
    result.hasCustomVariant = true;
    result.variantDefinition = matches.map(m => m[1]).join(', ');

    // Check if it uses extend
    if (content.includes('extend:')) {
      result.usesExtend = true;
    } else {
      result.usesExtend = false;

      // Try to detect potential shared variant matches
      const cardPattern = /rounded.*border.*bg|card/i;
      const buttonPattern = /inline-flex.*justify-center|button/i;
      const inputPattern = /input|form.*field/i;

      if (cardPattern.test(content)) {
        result.potentialSharedVariant = 'cardVariants';
      } else if (buttonPattern.test(content)) {
        result.potentialSharedVariant = 'buttonBaseVariants';
      } else if (inputPattern.test(content)) {
        result.potentialSharedVariant = 'inputVariants';
      }
    }
  }

  return result;
}

function walkDirectory(dir: string, results: AuditResult[] = []): AuditResult[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.next', '.git'].includes(entry.name)) {
        walkDirectory(fullPath, results);
      }
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      const result = findCustomVariants(fullPath);
      if (result.hasCustomVariant) {
        results.push(result);
      }
    }
  }

  return results;
}

function main() {
  console.log('🔍 Auditing variant adoption in components/ui...\n');

  const results = walkDirectory(COMPONENTS_DIR);
  const customVariants = results.filter(r => r.hasCustomVariant && !r.usesExtend);
  const usingExtend = results.filter(r => r.hasCustomVariant && r.usesExtend);

  console.log('📊 Audit Results:\n');

  if (usingExtend.length > 0) {
    console.log(`✅ ${usingExtend.length} component(s) using extend pattern:`);
    usingExtend.forEach(r => {
      console.log(`   - ${r.file} (${r.variantDefinition})`);
    });
    console.log('');
  }

  if (customVariants.length > 0) {
    console.log(`⚠️  ${customVariants.length} component(s) with custom variants (review for consolidation):`);
    customVariants.forEach(r => {
      console.log(`   - ${r.file}`);
      console.log(`     Variant: ${r.variantDefinition}`);
      if (r.potentialSharedVariant) {
        console.log(`     💡 Suggestion: Consider extending ${r.potentialSharedVariant}`);
      }
      console.log('');
    });
  } else {
    console.log('✅ No custom variants found (all components use shared variants or extend pattern)');
  }

  console.log('\n📋 Summary:');
  console.log(`   Total components scanned: ${results.length}`);
  console.log(`   Using extend pattern: ${usingExtend.length}`);
  console.log(`   Custom variants (review needed): ${customVariants.length}`);

  if (customVariants.length > 0) {
    console.log('\n💡 Next Steps:');
    console.log('   1. Review custom variants above');
    console.log('   2. Check if they can extend shared variants');
    console.log('   3. Refactor to use extend pattern where appropriate');
    process.exit(0); // Exit with 0 - this is informational, not an error
  } else {
    process.exit(0);
  }
}

void main();
