/**
 * @fileoverview README enhancement task for docs maintenance
 * @description Enhances README files with rich frontmatter and consistent structure
 */

import path from 'node:path';
import type { MarkdownFile, TransformResult, EnhanceOptions } from '../types';
import { scanMarkdownFiles, selectFilesByPatterns, writeMarkdownFile } from '../lib/fs';
import { readFrontmatter, writeFrontmatter, updateFrontmatter, isFrontmatterEnhanced } from '../lib/frontmatter';
import { enhanceMarkdownContent, generateTableOfContents } from '../lib/markdown';
import { getCurrentDate } from '../lib/frontmatter';

/**
 * Enhances README files with rich frontmatter and consistent structure
 */
export async function enhanceReadmes(options: EnhanceOptions = {}): Promise<TransformResult[]> {
  const results: TransformResult[] = [];

  try {
    // Scan for markdown files
    const allFiles = await scanMarkdownFiles();

    // Filter files based on options
    const selection = selectFilesByPatterns(allFiles, options.include, options.exclude);
    const filesToProcess = selection.files;

    console.log(`📄 Processing ${filesToProcess.length} files for README enhancement`);

    // Process each file
    for (const file of filesToProcess) {
      const result = await processReadmeEnhancement(file, options);
      results.push(result);

      if (result.changed && options.write) {
        const success = await writeMarkdownFile({ ...file, content: result.content });
        if (success) {
          console.log(`✅ Enhanced README: ${path.relative(process.cwd(), file.path)}`);
        }
      }
    }

    // Handle check mode
    if (options.check) {
      const hasChanges = results.some(r => r.changed);
      if (hasChanges) {
        console.error('❌ README files need enhancement (run with --write to fix)');
        process.exit(1);
      } else {
        console.log('✅ All README files are properly enhanced');
      }
    }

  } catch (error) {
    console.error('❌ README enhancement failed:', error);
    results.push({
      content: '',
      changed: false,
      errors: [String(error)],
    });
  }

  return results;
}

/**
 * Process a single README file for enhancement
 */
async function processReadmeEnhancement(file: MarkdownFile, options: EnhanceOptions): Promise<TransformResult> {
  try {
    const currentFrontmatter = readFrontmatter(file.content);

    // Skip if already enhanced and skipExisting is true
    if (options.skipExisting && isReadmeEnhanced(file.content)) {
      return { content: file.content, changed: false, errors: [] };
    }

    // Generate enhancement metadata
    const enhancementMetadata = generateEnhancementMetadata(file.path);

    // Generate table of contents if not present
    const toc = generateTableOfContents(file.content);
    const shouldAddToc = Boolean(toc && !file.content.includes('## Table of Contents'));

    // Enhance the content
    const enhancedContent = enhanceMarkdownContent(file.content, {
      toc: shouldAddToc,
    });

    // Update frontmatter with enhancement metadata
    const updates = {
      ...enhancementMetadata,
      last_updated: getCurrentDate(),
    };

    const updatedFile = updateFrontmatter(
      { ...file, content: enhancedContent },
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
 * Generates enhancement metadata for a README file
 */
function generateEnhancementMetadata(filePath: string) {
  const relativePath = path.relative(process.cwd(), filePath);
  const domain = inferDomainFromPath(filePath);
  const category = inferCategoryFromDomain(domain);

  // Generate title from file path
  const title = generateTitleFromPath(filePath);

  // Generate description based on domain and category
  const description = generateDescriptionFromPath(filePath, domain, category);

  return {
    title,
    description,
    category,
  };
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
    if (part && ['lib', 'components', 'types', 'hooks', 'contexts', 'styles', 'actions'].includes(part)) {
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
    hooks: 'hooks',
    contexts: 'contexts',
    styles: 'styling',
    actions: 'actions',
  };

  return categoryMap[domain] || 'documentation';
}

/**
 * Generates title from file path
 */
function generateTitleFromPath(filePath: string): string {
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(/[/\\]/);
  const lastPart = parts[parts.length - 2] || parts[parts.length - 1];

  if (!lastPart) return 'Documentation';

  // Convert kebab-case to title case
  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates description from path and domain
 */
function generateDescriptionFromPath(filePath: string, domain: string, category: string): string {
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(/[/\\]/);

  // Generate contextual description based on path and domain
  const descriptionMap: Record<string, string> = {
    lib: `Core ${domain} utilities and functionality for the Corso platform.`,
    components: `UI components for the ${domain} system, following atomic design principles.`,
    types: `TypeScript type definitions for ${domain}, ensuring type safety across the platform.`,
    hooks: `React hooks providing state management and functionality for ${domain}.`,
    contexts: `React context providers for ${domain} state and configuration.`,
    styles: `Styling system for ${domain}, using Tailwind CSS and design tokens.`,
    actions: `Server-side actions for ${domain}, handling data mutations and business logic.`,
  };

  const baseDescription = descriptionMap[domain] ||
    `Documentation and resources for ${domain} functionality.`;

  // Add specific context if we can infer it
  if (parts.length > 2) {
    const subPath = parts.slice(1, -1).join('/');
    if (subPath) {
      return `${baseDescription} Located in ${subPath}/.`;
    }
  }

  return baseDescription;
}

/**
 * Checks if README is already enhanced
 */
function isReadmeEnhanced(content: string): boolean {
  return isFrontmatterEnhanced(readFrontmatter(content)) &&
         (content.includes('## Table of Contents') || content.includes('<!-- TOC -->'));
}

