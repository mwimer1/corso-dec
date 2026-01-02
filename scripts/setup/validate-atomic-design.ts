#!/usr/bin/env tsx
// scripts/setup/validate-atomic-design.ts
// Cross-platform atomic design validation (Windows-first, no shell tool dependencies)

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { globby } from 'globby';

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

/**
 * Cross-platform file search helper
 * Replaces grep -r with Node.js file scanning
 */
async function searchFilesForPattern(
  searchPath: string,
  pattern: RegExp,
  fileExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.mdx']
): Promise<Array<{ file: string; matches: string[] }>> {
  const results: Array<{ file: string; matches: string[] }> = [];
  
  try {
    const files = await globby([`${searchPath}/**/*.{${fileExtensions.map(ext => ext.slice(1)).join(',')}}`], {
      gitignore: true,
      absolute: true,
    });

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');
        const matches: string[] = [];
        
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            matches.push(`${relative(process.cwd(), file)}:${index + 1}:${line.trim()}`);
          }
        });
        
        if (matches.length > 0) {
          results.push({ file: relative(process.cwd(), file), matches });
        }
      } catch {
        // Skip files we can't read
        continue;
      }
    }
  } catch (error) {
    // Return empty results on error
  }
  
  return results;
}

async function checkDesignTokenUsage() {
    log('\n🔍 3. Checking design token usage...');
    try {
      // Pattern matches: bg-blue-*, text-gray-*, border-red-*, bg-[#...]
      const pattern = /bg-blue-|text-gray-|border-red-|bg-\[#/;
      const matches = await searchFilesForPattern(componentPath, pattern);
      
      if (matches.length > 0) {
        log('❌ Hardcoded Tailwind classes found (should use design tokens):');
        const output = matches
          .slice(0, 10) // Limit to first 10 files
          .flatMap(m => m.matches.slice(0, 3)) // Limit to first 3 matches per file
          .join('\n');
        log(output + (matches.length > 10 ? '\n...' : ''));
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

async function checkCrossAtomicImports() {
    log('\n🔍 6. Checking for cross-atomic import violations...');
    try {
      const atomsPath = join(componentPath, 'atoms');
      if (!existsSync(atomsPath)) {
        log('⚠️  Atoms directory not found, skipping import check');
        return;
      }
      
      // Pattern matches: from .../molecules or from .../organisms
      const pattern = /from\s+['"].*\/molecules|from\s+['"].*\/organisms/;
      const matches = await searchFilesForPattern(atomsPath, pattern, ['.ts', '.tsx', '.js', '.jsx']);
      
      if (matches.length > 0) {
        log('❌ Atoms importing from higher-level components:');
        const output = matches
          .slice(0, 5) // Limit to first 5 files
          .flatMap(m => m.matches.slice(0, 2)) // Limit to first 2 matches per file
          .join('\n');
        log(output + (matches.length > 5 ? '\n...' : ''));
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

async function checkTailwindVariants() {
    log('\n🔍 7. Checking for tailwind-variants usage...');
    try {
      // Pattern matches: tailwind-variants, tv, or cva imports/usage
      const pattern = /tailwind-variants|['"]tv['"]|['"]cva['"]|from\s+['"].*tailwind-variants/;
      const matches = await searchFilesForPattern(componentPath, pattern, ['.ts', '.tsx']);
      
      if (matches.length > 0) {
        // Count unique files using variants
        const uniqueFiles = new Set(matches.map(m => m.file));
        log(`✅ Found ${uniqueFiles.size} components using tailwind-variants`);
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
      // Run typecheck and capture output
      const output = execSync('pnpm typecheck', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      // Filter for TypeScript error codes (TS#### pattern)
      const tsErrorPattern = /TS\d+/;
      const lines = output.split('\n');
      const errorLines = lines.filter(line => tsErrorPattern.test(line));
      
      if (errorLines.length === 0) {
        log('✅ No TypeScript errors in component exports');
      } else {
        log('❌ TypeScript errors detected:');
        log(errorLines.slice(0, 10).join('\n') + (errorLines.length > 10 ? '\n...' : ''));
        atomicIssues.push('TypeScript errors in component system');
      }
    } catch (error: any) {
      // execSync throws on non-zero exit, so check stderr for errors
      if (error.stderr) {
        const stderr = error.stderr.toString('utf8');
        const tsErrorPattern = /TS\d+/;
        const errorLines = stderr.split('\n').filter((line: string) => tsErrorPattern.test(line));
        
        if (errorLines.length > 0) {
          log('❌ TypeScript errors detected:');
          log(errorLines.slice(0, 10).join('\n') + (errorLines.length > 10 ? '\n...' : ''));
          atomicIssues.push('TypeScript errors in component system');
        } else {
          log('⚠️  Could not run TypeScript check');
        }
      } else {
        log('⚠️  Could not run TypeScript check');
      }
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

async function main() {
  log('⚛️  ATOMIC DESIGN SYSTEM AUDIT\n');
  log('='.repeat(50));

  validateStructure();
  checkBarrelExports();
  await checkDesignTokenUsage();
  checkComponentNaming();
  await checkCrossAtomicImports();
  await checkTailwindVariants();
  validateTypeScriptExports();
  printSummary();
}

main().catch((error) => {
  console.error('❌ Unexpected error during atomic design validation:', error);
  process.exitCode = 1;
});

