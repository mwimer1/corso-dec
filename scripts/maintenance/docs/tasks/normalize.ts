/**
 * @fileoverview Frontmatter normalization task for docs maintenance
 * @description Normalizes and fixes malformed frontmatter across all markdown files
 */

import path from 'node:path';
import { getCurrentDate, readFrontmatter, writeFrontmatter } from '../lib/frontmatter';
import { scanMarkdownFiles, selectFilesByPatterns, writeMarkdownFile } from '../lib/fs';
import type { Frontmatter, MarkdownFile, NormalizeOptions, TransformResult } from '../types';

/**
 * Normalizes frontmatter in markdown files
 */
export async function normalizeFrontmatter(options: NormalizeOptions = {}): Promise<TransformResult[]> {
  const results: TransformResult[] = [];

  try {
    // Scan for markdown files
    const allFiles = await scanMarkdownFiles();

    // Filter files based on options
    const selection = selectFilesByPatterns(allFiles, options.include, options.exclude);
    const filesToProcess = selection.files;

    console.log(`📄 Processing ${filesToProcess.length} files for frontmatter normalization`);

    // Process each file
    for (const file of filesToProcess) {
      const result = await processFrontmatterNormalization(file, options);
      results.push(result);

      if (result.changed && options.write) {
        const success = await writeMarkdownFile({ ...file, content: result.content });
        if (success) {
          console.log(`✅ Normalized frontmatter: ${path.relative(process.cwd(), file.path)}`);
        }
      }
    }

    // Handle check mode
    if (options.check) {
      const hasChanges = results.some(r => r.changed);
      if (hasChanges) {
        console.error('❌ Frontmatter needs normalization (run with --write to fix)');
        process.exit(1);
      } else {
        console.log('✅ All frontmatter is properly normalized');
      }
    }

  } catch (error) {
    console.error('❌ Frontmatter normalization failed:', error);
    results.push({
      content: '',
      changed: false,
      errors: [String(error)],
    });
  }

  return results;
}

/**
 * Process a single file for frontmatter normalization
 */
async function processFrontmatterNormalization(file: MarkdownFile, options: NormalizeOptions): Promise<TransformResult> {
  try {
    const currentFrontmatter = readFrontmatter(file.content);

    // Check if frontmatter exists
    const hasFrontmatter = file.content.startsWith('---');

    if (!hasFrontmatter) {
      // Add minimal frontmatter if missing
      const newFrontmatter = {
        title: inferTitleFromContent(file.content),
        description: inferDescriptionFromContent(file.content),
        last_updated: getCurrentDate(),
        category: 'documentation',
      };

      const newContent = writeFrontmatter(file.content, newFrontmatter);

      return {
        content: newContent,
        changed: true,
        errors: [],
      };
    }

    // Normalize existing frontmatter
    const normalizedFrontmatter = normalizeExistingFrontmatter(currentFrontmatter, options);

    // Check if normalization changed anything
    const hasChanges = JSON.stringify(normalizedFrontmatter) !== JSON.stringify(currentFrontmatter);

    if (!hasChanges && !options.force) {
      return { content: file.content, changed: false, errors: [] };
    }

    const newContent = writeFrontmatter(file.content, normalizedFrontmatter);

    return {
      content: newContent,
      changed: true,
      errors: [],
    };
  } catch (error) {
    return {
      content: file.content,
      changed: false,
      errors: [String(error)],
    };
  }
}

/**
 * Normalizes existing frontmatter
 */
function normalizeExistingFrontmatter(frontmatter: Frontmatter, options: NormalizeOptions): Frontmatter {
  const normalized = { ...frontmatter };

  // Normalize last_updated field
  if ('last_updated' in normalized && normalized.last_updated) {
    normalized.last_updated = normalizeDateString(normalized.last_updated);
  } else if (options.force) {
    normalized.last_updated = getCurrentDate();
  }

  // Normalize category field
  if (!('category' in normalized) || !normalized.category) {
    normalized.category = 'documentation';
  }

  // Normalize status field
  if (!('status' in normalized) || !normalized.status) {
    normalized.status = 'draft';
  }

  // Remove empty or undefined fields
  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') {
      delete normalized[key];
    }
  }

  return normalized as Frontmatter;
}

/**
 * Normalizes a date string to YYYY-MM-DD format
 */
function normalizeDateString(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return getCurrentDate();
    }
    return date.toISOString().split('T')[0] || getCurrentDate();
  } catch {
    return getCurrentDate();
  }
}

/**
 * Infers title from markdown content (first H1 or filename)
 */
function inferTitleFromContent(content: string): string {
  // Try to find first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }

  // Fallback to filename-based title
  return 'Documentation';
}

/**
 * Infers description from markdown content (first paragraph after H1)
 */
function inferDescriptionFromContent(content: string): string {
  // Try to find first paragraph after H1
  const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/, '');
  const firstParagraphMatch = contentWithoutFrontmatter.match(/^(?!#)(.+?)(?:\n\n|\n#|$)/s);

  if (firstParagraphMatch && firstParagraphMatch[1]) {
    const description = firstParagraphMatch[1].trim();
    // Truncate to reasonable length
    return description.length > 200 ? description.substring(0, 200) + '...' : description;
  }

  return 'Documentation and resources.';
}

