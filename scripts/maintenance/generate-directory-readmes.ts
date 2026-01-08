#!/usr/bin/env tsx

import { glob } from 'glob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { extractExportsFromFile, type ExportInfo } from '../utils/ts-exports-extractor';
import { detectRuntime, type RuntimeInfo } from '../utils/runtime-detector';

function normalizeRel(p: string): string {
  const rel = path.isAbsolute(p) ? path.relative(process.cwd(), p) : p;
  return rel.replace(/\\/g, '/');
}

function isScriptsReadme(rel: string): boolean {
  return rel.startsWith('scripts/') && rel.endsWith('/README.md');
}

async function getDirectoryStructure(dirPath: string, basePath: string, maxDepth = 2, currentDepth = 0, prefix = ''): Promise<string[]> {
  if (currentDepth >= maxDepth) return [];
  
  const items: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Sort: directories first, then files
    const sortedEntries = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (!entry) continue;
      
      const isLast = i === sortedEntries.length - 1;
      const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      
      // Skip hidden files, node_modules, .next, etc.
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === '.next' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === 'README.md') {
        continue;
      }
      
      if (entry.isDirectory()) {
        items.push(`${currentPrefix}${entry.name}/`);
        // Recursively get subdirectory structure
        const subItems = await getDirectoryStructure(
          path.join(dirPath, entry.name), 
          basePath, 
          maxDepth, 
          currentDepth + 1,
          nextPrefix
        );
        items.push(...subItems);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        // Only show TypeScript files at root level or in immediate subdirectories
        if (currentDepth <= 1) {
          items.push(`${currentPrefix}${entry.name}`);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return items;
}

async function getExportsFromIndex(indexPath: string): Promise<ExportInfo[]> {
  if (!existsSync(indexPath)) return [];
  
  try {
    // Use TypeScript-based extraction (handles re-exports correctly)
    return extractExportsFromFile(indexPath);
  } catch {
    return [];
  }
}

function getCategoryInfo(category: string, dirName: string, description?: string): { overview: string } {
  // Use description from frontmatter if available, otherwise generate generic
  if (description && description.trim()) {
    return { overview: description };
  }
  
  const baseOverview = `The ${dirName} directory contains ${category === 'library' ? 'library utilities and functionality' : category === 'components' ? 'UI components' : category === 'types' ? 'TypeScript type definitions' : category === 'styling' ? 'styling utilities and design tokens' : 'code'} for the Corso platform.`;
  
  return { overview: baseOverview };
}

function formatRuntimeInfo(runtime: RuntimeInfo): string {
  const confidenceEmoji = runtime.confidence === 'high' ? '✅' : runtime.confidence === 'medium' ? '⚠️' : '❓';
  let content = `**Runtime**: ${runtime.type} ${confidenceEmoji}\n\n`;
  
  if (runtime.reason) {
    content += `*${runtime.reason}*\n\n`;
  }
  
  if (runtime.signals.length > 0) {
    content += `**Signals detected:**\n`;
    for (const signal of runtime.signals.slice(0, 5)) {
      content += `- ${signal}\n`;
    }
    if (runtime.signals.length > 5) {
      content += `- ... (${runtime.signals.length - 5} more signals)\n`;
    }
    content += `\n`;
  }
  
  if (runtime.confidence === 'low' || runtime.type === 'unknown') {
    content += `> **Note**: Runtime detection is uncertain. Verify compatibility before use.\n\n`;
  }
  
  return content;
}

async function generateReadmeContent(filePath: string, frontmatter: string): Promise<string> {
  const dirPath = path.dirname(filePath);
  const dirName = path.basename(dirPath);
  const relPath = normalizeRel(dirPath);
  
  // Extract category and title from frontmatter
  const categoryMatch = frontmatter.match(/category:\s*["'](.+?)["']/);
  const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
  const descMatch = frontmatter.match(/description:\s*["'](.+?)["']/);
  
  const category = categoryMatch && categoryMatch[1] ? categoryMatch[1] : 'library';
  const title = titleMatch && titleMatch[1] ? titleMatch[1] : dirName.charAt(0).toUpperCase() + dirName.slice(1);
  const description = descMatch && descMatch[1] ? descMatch[1] : '';
  
  const { overview } = getCategoryInfo(category, dirName, description);
  
  // Get directory structure
  const structure = await getDirectoryStructure(dirPath, dirPath, 2);
  
  // Check for index.ts and get exports
  const indexPath = path.join(dirPath, 'index.ts');
  const exports = await getExportsFromIndex(indexPath);
  
  // Detect runtime
  const runtime = await detectRuntime(dirPath);
  
  // Use description as overview if available, otherwise use generated overview
  // Don't duplicate - if description exists, use it; otherwise generate
  const finalOverview = description && description.trim() ? description : overview;
  
  let content = `${frontmatter}\n\n# ${title}\n\n${finalOverview}\n\n`;
  
  // Runtime section (for libraries)
  if (category === 'library') {
    content += `## Runtime\n\n${formatRuntimeInfo(runtime)}`;
  }
  
  // Directory Structure
  if (structure.length > 0) {
    content += `## Directory Structure\n\n\`\`\`\n${relPath}/\n`;
    for (const item of structure.slice(0, 40)) { // Limit to 40 items
      content += `${item}\n`;
    }
    if (structure.length > 40) {
      content += `... (${structure.length - 40} more items)\n`;
    }
    content += `\`\`\`\n\n`;
  }
  
  // Public API / Exports
  if (exports.length > 0 && category === 'library') {
    // Separate types and values
    const valueExports = exports.filter(e => e.kind === 'value').slice(0, 15);
    const typeExports = exports.filter(e => e.kind === 'type').slice(0, 10);
    
    content += `## Public API\n\n`;
    
    if (valueExports.length > 0) {
      content += `**Value exports** from \`@/${relPath}\`:\n\n`;
      for (const exp of valueExports) {
        content += `- \`${exp.name}\`\n`;
      }
      if (valueExports.length < exports.filter(e => e.kind === 'value').length) {
        const remaining = exports.filter(e => e.kind === 'value').length - valueExports.length;
        content += `- ... (${remaining} more value exports)\n`;
      }
      content += `\n`;
    }
    
    if (typeExports.length > 0) {
      content += `**Type exports** from \`@/${relPath}\`:\n\n`;
      for (const exp of typeExports) {
        content += `- \`${exp.name}\` (type)\n`;
      }
      if (typeExports.length < exports.filter(e => e.kind === 'type').length) {
        const remaining = exports.filter(e => e.kind === 'type').length - typeExports.length;
        content += `- ... (${remaining} more type exports)\n`;
      }
      content += `\n`;
    }
  }
  
  // Usage section
  if (category === 'library' && exports.length > 0) {
    const firstValueExport = exports.find(e => e.kind === 'value');
    const firstTypeExport = exports.find(e => e.kind === 'type');
    
    content += `## Usage\n\n`;
    
    if (firstValueExport) {
      content += `\`\`\`typescript\nimport { ${firstValueExport.name} } from '@/${relPath}';\n\`\`\`\n\n`;
    }
    
    if (firstTypeExport) {
      content += `\`\`\`typescript\nimport type { ${firstTypeExport.name} } from '@/${relPath}';\n\`\`\`\n\n`;
    }
  } else if (category === 'components') {
    content += `## Usage\n\nImport components from the appropriate subdirectory:\n\n\`\`\`typescript\nimport { ComponentName } from '@/${relPath}/subdirectory';\n\`\`\`\n\n`;
  } else if (category === 'types') {
    content += `## Usage\n\nImport types from the appropriate subdirectory:\n\n\`\`\`typescript\nimport type { TypeName } from '@/${relPath}/subdirectory';\n\`\`\`\n\n`;
  } else if (category === 'styling') {
    content += `## Usage\n\nImport styles or tokens as needed:\n\n\`\`\`typescript\nimport '@/${relPath}/index.css';\n// or\nimport { tokenName } from '@/${relPath}';\n\`\`\`\n\n`;
  }
  
  return content;
}

async function main() {
  const files = await glob('**/README.md', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/scripts/**'],
  });

  const updated: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const rel = normalizeRel(file);
    
    // Skip scripts READMEs (handled by scripts generator)
    if (isScriptsReadme(rel)) {
      skipped.push(rel);
      continue;
    }

    // Skip root README and manually maintained ones
    if (rel === 'README.md' || 
        rel === 'lib/shared/README.md' || 
        rel === 'types/shared/README.md' ||
        rel === 'components/README.md') {
      skipped.push(rel);
      continue;
    }

    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Extract frontmatter first to get category
      const frontmatterMatch = content.match(/^(---\n[\s\S]*?\n---)/);
      if (!frontmatterMatch || !frontmatterMatch[1]) {
        skipped.push(rel);
        continue;
      }
      
      const frontmatter = frontmatterMatch[1];
      const categoryMatch = frontmatter.match(/category:\s*["'](.+?)["']/);
      const category = categoryMatch && categoryMatch[1] ? categoryMatch[1] : 'library';
      
      // Only update READMEs that are essentially empty (minimal content)
      // Conservative heuristic: minimal if < 5 non-empty lines after frontmatter + heading
      const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n+/, '').trim();
      const contentLines = afterFrontmatter.split('\n').filter(l => l.trim() && !l.match(/^#+\s/));
      const isMinimal = contentLines.length < 5;
      
      // Also update if it's a library README missing key sections (Runtime, Public API)
      const isLibrary = category === 'library';
      const hasRuntime = content.includes('## Runtime');
      const hasPublicAPI = content.includes('## Public API');
      const needsEnhancement = isLibrary && (!hasRuntime || !hasPublicAPI);
      
      if (!isMinimal && !needsEnhancement) {
        // Has substantial content and all key sections, skip
        continue;
      }
      const newContent = await generateReadmeContent(file, frontmatter);
      
      if (newContent !== content) {
        await fs.writeFile(file, newContent, 'utf8');
        updated.push(rel);
      }
    } catch (error) {
      console.error(`⚠️  Error processing ${rel}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`✅ Updated ${updated.length} README(s)`);
  if (updated.length > 0) {
    console.log('\nUpdated files:');
    for (const file of updated.slice(0, 20)) {
      console.log(`  - ${file}`);
    }
    if (updated.length > 20) {
      console.log(`  ... (${updated.length - 20} more)`);
    }
  }
  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipped ${skipped.length} README(s) (scripts, manually maintained, or already has content)`);
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
