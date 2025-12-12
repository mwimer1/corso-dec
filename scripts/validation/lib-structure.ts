#!/usr/bin/env tsx

/**
 * Lib Structure Validator
 *
 * Validates domain-driven architecture compliance in the lib/ directory.
 * Checks for required files, barrel exports, import boundaries, and runtime safety.
 *
 * Usage:
 *   pnpm guard:structure [--strict]
 *
 * Modes:
 *   default: Warn on soft issues, fail on hard violations
 *   --strict: Fail on all warnings (including legacy exceptions)
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { glob } from 'glob';
import { join, relative, resolve } from 'path';

interface ValidationIssue {
  type: 'error' | 'warning';
  domain: string;
  file: string;
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  domain: string;
  issues: ValidationIssue[];
  score: number; // 0-100, 100 being perfect
}

class LibStructureValidator {
  private libPath = resolve('lib');
  private issues: ValidationIssue[] = [];
  private strict = false;
  private legacyExceptions = new Set([
    'rate-limiting', // Legacy hyphenated folder
    'rate-limit', // Legacy wrapper files
    'actions/rate-limiting.ts', // Legacy wrapper
  ]);

  constructor(strict = false) {
    this.strict = strict;
  }

  async validate(): Promise<ValidationResult[]> {
    console.log('🔍 Validating lib/ directory structure...');

    const domains = this.getDomains();
    const results: ValidationResult[] = [];

    for (const domain of domains) {
      const result = await this.validateDomain(domain);
      results.push(result);
    }

    // Cross-domain validation
    await this.validateCrossDomainImports(domains);

    // Runtime boundary validation
    await this.validateRuntimeBoundaries();

    return results;
  }

  private getDomains(): string[] {
    const entries = readdirSync(this.libPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => !this.isExcludedDomain(name));
  }

  private isExcludedDomain(name: string): boolean {
    // Exclude special directories that aren't domains
    const excluded = ['__tests__', 'node_modules', '.git'];
    return excluded.includes(name) || name.startsWith('.');
  }

  private async validateDomain(domain: string): Promise<ValidationResult> {
    const domainPath = join(this.libPath, domain);
    const issues: ValidationIssue[] = [];

    // Check for required files
    issues.push(...this.checkRequiredFiles(domain, domainPath));

    // Check barrel exports
    issues.push(...await this.checkBarrelExports(domain, domainPath));

    // Check naming conventions
    issues.push(...this.checkNamingConventions(domain, domainPath));

    // Check file organization
    issues.push(...this.checkFileOrganization(domain, domainPath));

    const score = Math.max(0, 100 - (issues.length * 10));

    return {
      domain,
      issues,
      score
    };
  }

  private checkRequiredFiles(domain: string, domainPath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Must have README.md
    if (!existsSync(join(domainPath, 'README.md'))) {
      issues.push({
        type: 'error',
        domain,
        file: 'README.md',
        message: 'Missing README.md',
        suggestion: 'Create README.md following .github/templates/domain-readme.md'
      });
    }

    // Must have index.ts for non-server-only domains
    const indexPath = join(domainPath, 'index.ts');
    if (!existsSync(indexPath)) {
      issues.push({
        type: 'error',
        domain,
        file: 'index.ts',
        message: 'Missing index.ts barrel file',
        suggestion: 'Create index.ts following domain-driven guidelines'
      });
    }

    return issues;
  }

  private async checkBarrelExports(domain: string, domainPath: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check root barrel
    const indexPath = join(domainPath, 'index.ts');
    if (existsSync(indexPath)) {
      issues.push(...this.validateBarrelFile(domain, indexPath, 'index.ts'));
    }

    // Check server barrel if it exists
    const serverPath = join(domainPath, 'server.ts');
    if (existsSync(serverPath)) {
      issues.push(...this.validateBarrelFile(domain, serverPath, 'server.ts'));
    }

    // Check sub-domain barrels
    const subdirs = readdirSync(domainPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    for (const subdir of subdirs) {
      const subIndexPath = join(domainPath, subdir, 'index.ts');
      if (existsSync(subIndexPath)) {
        const files = readdirSync(join(domainPath, subdir))
          .filter(file => file.endsWith('.ts') && file !== 'index.ts');

        if (files.length >= 4) {
          issues.push(...this.validateBarrelFile(domain, subIndexPath, `${subdir}/index.ts`));
        } else {
          issues.push({
            type: 'warning',
            domain,
            file: `${subdir}/index.ts`,
            message: `Sub-domain has ${files.length} files but has barrel - consider removing if < 4 files`,
            suggestion: 'Remove barrel or add more files to justify it'
          });
        }
      } else if (this.getTsFilesInDir(join(domainPath, subdir)).length >= 4) {
        issues.push({
          type: 'warning',
          domain,
          file: `${subdir}/`,
          message: `Sub-domain has >= 4 files but no barrel`,
          suggestion: 'Create index.ts barrel for sub-domain'
        });
      }
    }

    return issues;
  }

  private validateBarrelFile(domain: string, filePath: string, relativePath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    try {
      const content = readFileSync(filePath, 'utf-8');

      // Check for 'use server' directive in server barrels
      if (relativePath.includes('server') && !content.includes("'use server'")) {
        issues.push({
          type: 'warning',
          domain,
          file: relativePath,
          message: 'Server barrel missing \'use server\' directive',
          suggestion: 'Add \'use server\' at the top of server.ts'
        });
      }

      // Check for empty barrels
      const exportLines = content.split('\n').filter(line =>
        line.trim().startsWith('export') && !line.trim().startsWith('//')
      );

      if (exportLines.length === 0) {
        issues.push({
          type: 'warning',
          domain,
          file: relativePath,
          message: 'Barrel file appears to have no exports',
          suggestion: 'Add actual exports or remove empty barrel'
        });
      }

    } catch (error) {
      const msg = (error as any)?.message ?? String(error);
      issues.push({
        type: 'error',
        domain,
        file: relativePath,
        message: `Failed to read barrel file: ${msg}`,
        suggestion: 'Ensure file is readable and properly formatted'
      });
    }

    return issues;
  }

  private checkNamingConventions(domain: string, domainPath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check domain name for hyphens (except legacy)
    if (domain.includes('-') && !this.legacyExceptions.has(domain)) {
      issues.push({
        type: this.strict ? 'error' : 'warning',
        domain,
        file: '',
        message: `Domain name '${domain}' contains hyphens`,
        suggestion: 'Use camelCase (e.g., rateLimiting) instead of hyphens'
      });
    }

    // Check file names in domain
    const files = this.getAllFiles(domainPath);
    for (const file of files) {
      const fileName = file.split('/').pop() || '';

      // Check for non-kebab-case in multi-word files
      if (fileName.includes(' ') || fileName.includes('_')) {
        issues.push({
          type: 'warning',
          domain,
          file,
          message: `File name '${fileName}' uses spaces or underscores`,
          suggestion: 'Use kebab-case for multi-word file names'
        });
      }
    }

    return issues;
  }

  private checkFileOrganization(domain: string, domainPath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for misplaced files
    const files = this.getAllFiles(domainPath);
    const rootTsFiles = files.filter(file =>
      file.endsWith('.ts') &&
      !file.includes('/') &&
      !file.endsWith('index.ts') &&
      !file.endsWith('server.ts')
    );

    // If root has too many files, suggest subfolders
    if (rootTsFiles.length > 10) {
      issues.push({
        type: 'warning',
        domain,
        file: '',
        message: `Domain root has ${rootTsFiles.length} .ts files`,
        suggestion: 'Consider organizing into subfolders (e.g., core/, utils/, types/)'
      });
    }

    return issues;
  }

  private async validateCrossDomainImports(domains: string[]): Promise<void> {
    // Find all TypeScript files in lib/ (ignore temp/fixture folders)
    const tsFiles = await glob('lib/**/*.ts', {
      ignore: ['lib/**/*.d.ts', 'lib/**/node_modules/**', 'lib/**/fixtures/**']
    });

    for (const file of tsFiles) {
      // The file list can race with other tests that create/remove files in lib/.
      if (!existsSync(file)) continue;
      
      let content: string;
      try {
        content = readFileSync(file, 'utf-8');
      } catch (err: any) {
        // Tolerate concurrent deletion; rethrow anything else.
        if (err && err.code === 'ENOENT') continue;
        throw err;
      }
      
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = (lines[i] ?? '').trim();

        // Check for cross-domain leaf imports
        const crossDomainMatch = line.match(/from ['"`]@\S*lib\/([^/]+)\/(.+)['"`]/);
        if (crossDomainMatch) {
          const [, targetDomain, importPath] = crossDomainMatch as string[];

          // Skip if importing from same domain or shared
          if (targetDomain === 'shared' || targetDomain === 'core') {
            continue;
          }

          // Check if it's a leaf import (not barrel)
          if (importPath && importPath.includes('/') && !importPath.includes('/index')) {
            const relativePath = relative(this.libPath, file);
            const sourceDomain = relativePath.split('/')[0];

            if (sourceDomain && sourceDomain !== targetDomain) {
              this.issues.push({
                type: 'error',
                domain: sourceDomain,
                file: relativePath,
                message: `Cross-domain leaf import: ${line}`,
                suggestion: 'Import from domain barrel instead: @/lib/' + targetDomain
              });
            }
          }
        }
      }
    }
  }

  private async validateRuntimeBoundaries(): Promise<void> {
    // Check for Node-only imports in Edge-compatible files
    const edgeFiles = await glob('app/**/route.ts', { ignore: ['**/node_modules/**'] });

    for (const file of edgeFiles) {
      const content = readFileSync(file, 'utf-8');

      // Check if file declares Edge runtime
      if (content.includes("export const runtime = 'edge'")) {
        // Look for forbidden imports
        const forbiddenImports = [
          /from ['"`]@\S*lib\/server['"`]/,
          /from ['"`]@\S*lib\/[^/]+\/server['"`]/,
          /from ['"`]@\S*lib\/integrations['"`]/,
          /from ['"`]@\S*lib\/auth['"`]/,
        ];

        for (const pattern of forbiddenImports) {
          if (pattern.test(content)) {
            this.issues.push({
              type: 'error',
              domain: 'runtime',
              file: relative(process.cwd(), file),
              message: 'Edge route imports Node-only modules',
              suggestion: 'Use @/lib/api for Edge-safe utilities'
            });
            break;
          }
        }
      }
    }
  }

  private getTsFilesInDir(dirPath: string): string[] {
    try {
      return readdirSync(dirPath)
        .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'));
    } catch {
      return [];
    }
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];

    function traverse(currentPath: string, relativePath = '') {
      const entries = readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);
        const relPath = relativePath ? join(relativePath, entry.name) : entry.name;

        if (entry.isDirectory()) {
          traverse(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          files.push(relPath);
        }
      }
    }

    traverse(dirPath);
    return files;
  }

  printResults(results: ValidationResult[]): void {
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    const totalErrors = results.reduce((sum, result) =>
      sum + result.issues.filter(i => i.type === 'error').length, 0
    );
    const totalWarnings = totalIssues - totalErrors;

    console.log(`\n📊 Validation Summary:`);
    console.log(`   Domains checked: ${results.length}`);
    console.log(`   Total issues: ${totalIssues} (${totalErrors} errors, ${totalWarnings} warnings)`);

    for (const result of results) {
      if (result.issues.length > 0) {
        console.log(`\n🏗️  Domain: ${result.domain} (Score: ${result.score}%)`);

        for (const issue of result.issues) {
          const icon = issue.type === 'error' ? '❌' : '⚠️ ';
          console.log(`   ${icon} ${issue.file}: ${issue.message}`);
          if (issue.suggestion) {
            console.log(`      💡 ${issue.suggestion}`);
          }
        }
      }
    }

    if (totalIssues === 0) {
      console.log('\n🎉 All domains pass validation!');
    } else {
      console.log(`\n${totalErrors > 0 ? '❌' : '⚠️ '} Validation ${totalErrors > 0 ? 'failed' : 'passed with warnings'}`);

      if (totalErrors > 0) {
        process.exit(1);
      }
    }
  }

  async run(): Promise<void> {
    const results = await this.validate();
    this.printResults(results);
  }
}

// CLI runner
async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');
  const validator = new LibStructureValidator(strict);

  try {
    await validator.run();
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

// Check if this is the main module (ES module equivalent of require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { LibStructureValidator };


