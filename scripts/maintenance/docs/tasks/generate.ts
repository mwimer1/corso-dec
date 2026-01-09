/**
 * @fileoverview README generation task for docs maintenance
 * @description Generates README files with export tables and metadata
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Project, Node, SyntaxKind, type ExportDeclaration } from 'ts-morph';
import { getCurrentDate, readFrontmatter, updateFrontmatter } from '../lib/frontmatter';
import { scanMarkdownFiles, selectFilesByPatterns, writeMarkdownFile } from '../lib/fs';
import { generateExportsTable, updateExportsTable } from '../lib/markdown';
import type { GenerateOptions, MarkdownFile, TransformResult } from '../types';

/**
 * Generates README files with export tables and metadata
 */
export async function generateReadmes(options: GenerateOptions = {}): Promise<TransformResult[]> {
  const results: TransformResult[] = [];

  try {
    // If paths are specified (incremental mode), filter to only affected files
    let filesToProcess: MarkdownFile[];
    
    if (options.paths && options.paths.length > 0) {
      // Incremental mode: only process files affected by changed paths
      const affectedFiles = determineAffectedFiles(options.paths);
      
      // Scan for markdown files
      const allFiles = await scanMarkdownFiles();
      
      // Filter to only affected files
      filesToProcess = allFiles.filter(file => {
        const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
        return affectedFiles.has(relativePath);
      });
      
      console.log(`📄 Incremental mode: Processing ${filesToProcess.length} affected file(s) from ${options.paths.length} changed path(s)`);
    } else {
      // Full mode: scan all files
      const allFiles = await scanMarkdownFiles();
      
      // Filter files based on options
      const selection = selectFilesByPatterns(allFiles, options.include, options.exclude);
      filesToProcess = options.domains?.length
        ? selection.files.filter(file => options.domains?.some(domain =>
            file.path.includes(`/${domain}/`) || file.path.includes(`\\${domain}\\`)))
        : selection.files;
      
      console.log(`📄 Processing ${filesToProcess.length} files for README generation`);
    }

    // Process each file
    for (const file of filesToProcess) {
      const result = await processReadmeFile(file, options);
      results.push(result);

      if (result.changed && options.write) {
        const success = await writeMarkdownFile({ ...file, content: result.content });
        if (success) {
          console.log(`✅ Generated README: ${path.relative(process.cwd(), file.path)}`);
        }
      }
    }

    // Handle check mode
    if (options.check) {
      const hasChanges = results.some(r => r.changed);
      if (hasChanges) {
        console.error('❌ README files need generation (run with --write to fix)');
        process.exit(1);
      } else {
        console.log('✅ All README files are up to date');
      }
    }

  } catch (error) {
    console.error('❌ README generation failed:', error);
    results.push({
      content: '',
      changed: false,
      errors: [String(error)],
    });
  }

  return results;
}

/**
 * Process a single README file for generation
 */
async function processReadmeFile(file: MarkdownFile, options: GenerateOptions): Promise<TransformResult> {
  try {
    const currentFrontmatter = readFrontmatter(file.content);
    const domain = inferDomainFromPath(file.path);

    // Skip if already enhanced and skipExisting is true
    if (options.skipExisting && isReadmeEnhanced(file.content)) {
      return { content: file.content, changed: false, errors: [] };
    }

    // Generate exports table
    const exportsTable = await generateDomainExportsTable(domain, file.path);

    // Update content with exports table
    const contentWithExports = updateExportsTable(file.content, exportsTable);

    // Update frontmatter with current date and domain info
    const updates = {
      last_updated: getCurrentDate(),
      category: inferCategoryFromDomain(domain),
    };

    const updatedFile = updateFrontmatter(
      { ...file, content: contentWithExports },
      updates
    );

    return updatedFile;
  } catch (error) {
    return {
      content: file.content,
      changed: false,
      errors: [String(error)],
    };
  }
}

/**
 * Generates exports table for a domain
 */
async function generateDomainExportsTable(domain: string, readmePath: string): Promise<string> {
  try {
    // Find the domain directory
    const domainDir = path.dirname(readmePath);

    // Try to read barrel exports
    const exports = await readDomainExports(domainDir);

    if (exports.length === 0) {
      return generateEmptyExportsTable(domain);
    }

    const importPath = `@/${domain}`;
    return generateExportsTable(exports, domain, importPath);
  } catch (error) {
    console.warn(`Warning: Could not generate exports for ${domain}:`, error);
    return generateEmptyExportsTable(domain);
  }
}

/**
 * Safely gets module specifier value from an ExportDeclaration
 */
function getModuleSpecifierValueSafe(node: ExportDeclaration): string | undefined {
  // Try newer ts-morph API first
  if (typeof (node as any).getModuleSpecifierValue === 'function') {
    return (node as any).getModuleSpecifierValue();
  }
  // Fallback to older API
  const literal = node.getModuleSpecifier();
  return literal ? literal.getLiteralText() : undefined;
}

/**
 * Reads exports from a domain directory
 */
async function readDomainExports(domainDir: string): Promise<string[]> {
  const indexPath = path.join(domainDir, 'index.ts');

  try {
    await fs.access(indexPath);

    const project = new Project({
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: true,
    });

    const sourceFile = project.addSourceFileAtPath(indexPath);
    const exports: string[] = [];

    // Extract export statements
    for (const statement of sourceFile.getStatements()) {
      if (Node.isExportDeclaration(statement)) {
        const moduleSpecifier = getModuleSpecifierValueSafe(statement);

        if (moduleSpecifier) {
          // Extract the module name from './module' or '../module'
          const moduleName = path.basename(moduleSpecifier, '.ts');
          exports.push(moduleName);
        }
      }
    }

    return [...new Set(exports)]; // Remove duplicates
  } catch {
    return [];
  }
}

/**
 * Generates empty exports table
 */
function generateEmptyExportsTable(domain: string): string {
  return `| ${domain} | Purpose | Import Path |
|--------|---------|-------------|
| No exports found | | |`;
}

/**
 * Infers domain name from file path
 */
function inferDomainFromPath(filePath: string): string {
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(/[/\\]/);

  // Find the domain (e.g., 'lib', 'components', 'types', etc.)
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    // Note: hooks/ and contexts/ directories no longer exist at root level
    if (part && ['lib', 'components', 'types', 'styles', 'actions'].includes(part)) {
      return part;
    }
  }

  return 'documentation';
}

/**
 * Infers category from domain
 */
function inferCategoryFromDomain(domain: string): string {
  const categoryMap: Record<string, string> = {
    lib: 'library',
    components: 'components',
    types: 'types',
    styles: 'styling',
    actions: 'actions',
  };

  return categoryMap[domain] || 'documentation';
}

/**
 * Checks if README is already enhanced
 */
function isReadmeEnhanced(content: string): boolean {
  return content.includes('<!-- EXPORTS_TABLE -->') &&
         content.includes('last_updated:');
}

/**
 * Determines which README files are affected by changed paths
 * - docs/index.ts if any markdown changed
 * - scripts READMEs only if scripts changed
 */
function determineAffectedFiles(changedPaths: string[]): Set<string> {
  const affected = new Set<string>();
  const normalizedPaths = changedPaths.map(p => p.replace(/\\/g, '/'));
  
  // Check if any markdown files changed (affects docs/index.ts)
  const hasMarkdownChanges = normalizedPaths.some(p => 
    p.endsWith('.md') || p.includes('/docs/') || p.includes('README.md')
  );
  
  // Check if any scripts files changed (affects scripts/**/README.md)
  const hasScriptsChanges = normalizedPaths.some(p => 
    p.startsWith('scripts/') && (p.endsWith('.ts') || p.endsWith('.tsx'))
  );
  
  if (hasMarkdownChanges) {
    // Mark docs/index.ts as needing update
    affected.add('docs/index.ts');
  }
  
  if (hasScriptsChanges) {
    // Find all scripts/**/README.md files that need updating
    // We'll need to scan for these, but for now, mark common ones
    affected.add('scripts/README.md');
    // Note: The actual scripts/**/README.md files will be determined by the scan
    // This is a simplified version - in practice, we'd scan scripts/ recursively
  }
  
  return affected;
}

