#!/usr/bin/env tsx
// scripts/setup/validate-atomic-design.ts

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const log = console.log;
const componentPath = 'components/ui';
const atomicDirs = ['atoms', 'molecules', 'organisms'];
const atomicIssues: string[] = [];

function validateStructure() {
  log('\n🔍 1. Validating atomic design structure...');
  atomicDirs.forEach((dir) => {
    const dirPath = join(componentPath, dir);
    if (!existsSync(dirPath)) {
      log(`❌ Missing ${dir} directory`);
      atomicIssues.push(`Missing ${dir} directory`);
    } else {
      const componentCount = readdirSync(dirPath).filter(
        (file) => statSync(join(dirPath, file)).isDirectory() || file.endsWith('.tsx')
      ).length;
      log(`✅ ${dir}: ${componentCount} components found`);
    }
  });
}

function checkBarrelExports() {
  log('\n🔍 2. Checking barrel export consistency...');
  atomicDirs.forEach((dir) => {
    const barrelPath = join(componentPath, dir, 'index.ts');
    if (!existsSync(barrelPath)) {
      log(`❌ Missing barrel export: ${dir}/index.ts`);
      atomicIssues.push(`Missing barrel export for ${dir}`);
    } else {
      try {
        const barrelContent = readFileSync(barrelPath, 'utf8');
        const exportCount = (barrelContent.match(/export/g) || []).length;
        log(`✅ ${dir} barrel: ${exportCount} exports`);
        if (barrelContent.includes('export *')) {
          log(`⚠️  ${dir} uses wildcard exports - check for TS2308 conflicts`);
        }
      } catch (error) {
        log(`❌ Cannot read barrel file: ${dir}/index.ts`);
        atomicIssues.push(`Cannot read barrel file for ${dir}`);
      }
    }
  });
}

function checkDesignTokenUsage() {
    log('\n🔍 3. Checking design token usage...');
    try {
      const hardcodedStyles = execSync(
        `grep -r "bg-blue-\\|text-gray-\\|border-red-\\|bg-\\[\\#" ${componentPath}/ 2>/dev/null || echo "No hardcoded styles found"`,
        { encoding: 'utf8' }
      );
      if (!hardcodedStyles.includes('No hardcoded styles found')) {
        log('❌ Hardcoded Tailwind classes found (should use design tokens):');
        log(hardcodedStyles.slice(0, 500) + '...');
        atomicIssues.push('Hardcoded styles detected - should use design tokens');
      } else {
        log('✅ No hardcoded styles detected');
      }
    } catch (error) {
        if (error instanceof Error) {
            log('❌ Error checking design token usage:', error.message);
        }
    }
}


function checkComponentNaming() {
    log('\n🔍 5. Checking component naming conventions...');
    atomicDirs.forEach((dir) => {
      const dirPath = join(componentPath, dir);
      if (existsSync(dirPath)) {
        readdirSync(dirPath).forEach((item) => {
          const itemPath = join(dirPath, item);
          if (statSync(itemPath).isDirectory()) {
            if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(item)) {
              log(`❌ Invalid directory naming: ${dir}/${item} (should be kebab-case)`);
              atomicIssues.push(`Invalid directory naming: ${dir}/${item}`);
            }
          } else if (item.endsWith('.tsx')) {
            const filename = item.replace('.tsx', '');
            if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(filename)) {
              log(`❌ Invalid file naming: ${dir}/${item} (should be kebab-case)`);
              atomicIssues.push(`Invalid file naming: ${dir}/${item}`);
            }
          }
        });
      }
    });
}

function checkCrossAtomicImports() {
    log('\n🔍 6. Checking for cross-atomic import violations...');
    try {
      const atomsImportViolations = execSync(
        `grep -r "from.*molecules\\|from.*organisms" ${componentPath}/components/ui/atoms/ 2>/dev/null || echo "No violations found"`,
        { encoding: 'utf8' }
      );
      if (!atomsImportViolations.includes('No violations found')) {
        log('❌ Atoms importing from higher-level components:');
        log(atomsImportViolations.slice(0, 300) + '...');
        atomicIssues.push('Atoms violating import hierarchy');
      } else {
        log('✅ No atomic import violations detected');
      }
    } catch (error) {
        if (error instanceof Error) {
            log('❌ Error checking import violations:', error.message);
        }
    }
}

function checkTailwindVariants() {
    log('\n🔍 7. Checking for tailwind-variants usage...');
    try {
      const variantUsage = execSync(
        `grep -r "tailwind-variants\\|tv\\|cva" ${componentPath}/ 2>/dev/null || echo "No variants found"`,
        { encoding: 'utf8' }
      );
      if (!variantUsage.includes('No variants found')) {
        const variantCount = (variantUsage.match(/tv\\|cva/g) || []).length;
        log(`✅ Found ${variantCount} components using tailwind-variants`);
      } else {
        log('⚠️  No tailwind-variants usage detected - consider using for consistency');
      }
    } catch (error) {
        if (error instanceof Error) {
            log('❌ Error checking variant usage:', error.message);
        }
    }
}

function validateTypeScriptExports() {
    log('\n🔍 8. Checking TypeScript exports...');
    try {
      const tsErrors = execSync('pnpm typecheck 2>&1 | grep -E "TS[0-9]+" || echo "No TS errors"', {
        encoding: 'utf8',
      });
      if (tsErrors.includes('No TS errors')) {
        log('✅ No TypeScript errors in component exports');
      } else {
        log('❌ TypeScript errors detected:');
        log(tsErrors.slice(0, 500) + '...');
        atomicIssues.push('TypeScript errors in component system');
      }
    } catch (error) {
      log('⚠️  Could not run TypeScript check');
    }
}

function printSummary() {
  log('\n' + '='.repeat(50));
  log('⚛️  ATOMIC DESIGN AUDIT SUMMARY');
  log('='.repeat(50));
  if (atomicIssues.length === 0) {
    log('✅ Atomic design system is well-structured!');
    log('✅ All components follow proper conventions');
  } else {
    log(`❌ Found ${atomicIssues.length} atomic design issue(s):`);
    atomicIssues.forEach((issue, index) => {
      log(`   ${index + 1}. ${issue}`);
    });
    log('\n🔧 RECOMMENDATIONS:');
    log('   • Fix component naming to use kebab-case');
    log('   • Add missing barrel exports for all atomic levels');
    log('   • Replace hardcoded styles with design tokens');
    log('   • Fix import hierarchy violations');
    log('   • Consider using tailwind-variants for consistency');
  }
  log('\n📊 ATOMIC DESIGN METRICS:');
  atomicDirs.forEach((dir) => {
    const dirPath = join(componentPath, dir);
    if (existsSync(dirPath)) {
      const count = readdirSync(dirPath).filter(
        (file) => file.endsWith('.tsx') || statSync(join(dirPath, file)).isDirectory()
      ).length;
      log(`   ${dir}: ${count} components`);
    }
  });
  process.exit(atomicIssues.length > 0 ? 1 : 0);
}

function main() {
  log('⚛️  ATOMIC DESIGN SYSTEM AUDIT\n');
  log('='.repeat(50));

  validateStructure();
  checkBarrelExports();
  checkDesignTokenUsage();
  checkComponentNaming();
  checkCrossAtomicImports();
  checkTailwindVariants();
  validateTypeScriptExports();
  printSummary();
}

main();

