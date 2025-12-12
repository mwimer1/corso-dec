/**
 * @fileoverview Frontmatter utilities for docs maintenance
 * @description Reading, writing, and normalizing frontmatter in markdown files
 */

import { isNonEmptyString } from '../../_utils/guards';
import { FRONTMATTER_DEFAULTS } from '../constants';
import type { Frontmatter, MarkdownFile, TransformResult } from '../types';

/**
 * Reads frontmatter from markdown content
 */
export function readFrontmatter(content: string): Frontmatter {
  const frontmatter: Frontmatter = {};

  // Check if content starts with frontmatter
  if (!content.startsWith('---')) {
    return frontmatter;
  }

  // Find the end of frontmatter
  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return frontmatter;
  }

  const fmContent = content.slice(3, endIndex).trim();

  // Simple key-value parsing (basic YAML-like)
  const lines = fmContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      const trimmedKey = key?.trim();
      const trimmedValue = value?.replace(/^["']|["']$/g, '').trim();
      if (isNonEmptyString(trimmedKey) && isNonEmptyString(trimmedValue)) {
        frontmatter[trimmedKey] = trimmedValue;
      }
    }
  }

  return frontmatter;
}

/**
 * Writes frontmatter to markdown content
 */
export function writeFrontmatter(content: string, frontmatter: Frontmatter): string {
  // Remove existing frontmatter first
  const contentWithoutFrontmatter = removeFrontmatter(content);

  // Generate frontmatter string
  const fmLines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined) {
      fmLines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  fmLines.push('---');
  fmLines.push(''); // Empty line after frontmatter

  return fmLines.join('\n') + contentWithoutFrontmatter;
}

/**
 * Removes frontmatter from markdown content
 */
export function removeFrontmatter(content: string): string {
  if (!content.startsWith('---')) {
    return content;
  }

  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return content;
  }

  return content.slice(endIndex + 4).trimStart();
}

/**
 * Normalizes frontmatter with defaults and validation
 */
export function normalizeFrontmatter(
  frontmatter: Frontmatter,
  options: { force?: boolean } = {}
): Frontmatter {
  const normalized: Frontmatter = { ...frontmatter };

  // Apply defaults for missing fields
  if (!normalized.category && !options.force) {
    normalized.category = FRONTMATTER_DEFAULTS.category;
  }

  if (!normalized.status && !options.force) {
    normalized.status = FRONTMATTER_DEFAULTS.status;
  }

  // Normalize date format
  if (normalized.last_updated) {
    normalized.last_updated = normalizeDate(normalized.last_updated);
  }

  return normalized;
}

/**
 * Normalizes a date string to YYYY-MM-DD format
 */
export function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return getCurrentDate();
    }
    return date.toISOString().slice(0, 10);
  } catch {
    return getCurrentDate();
  }
}

/**
 * Updates frontmatter in a markdown file
 */
export function updateFrontmatter(
  file: MarkdownFile,
  updates: Partial<Frontmatter>
): TransformResult {
  try {
    const currentFrontmatter = readFrontmatter(file.content);
    const newFrontmatter = { ...currentFrontmatter, ...updates };

    // Normalize the frontmatter
    const normalizedFrontmatter = normalizeFrontmatter(newFrontmatter);

    const newContent = writeFrontmatter(file.content, normalizedFrontmatter);

    return {
      content: newContent,
      changed: newContent !== file.content,
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
 * Checks if frontmatter is already enhanced (has required fields)
 */
export function isFrontmatterEnhanced(frontmatter: Frontmatter): boolean {
  return Boolean(
    frontmatter.title &&
    frontmatter.description &&
    frontmatter.category &&
    frontmatter.last_updated
  );
}

/**
 * Gets the current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Merges frontmatter objects with conflict resolution
 */
export function mergeFrontmatter(
  base: Frontmatter,
  overlay: Frontmatter,
  strategy: 'overlay' | 'base' | 'merge' = 'merge'
): Frontmatter {
  switch (strategy) {
    case 'overlay':
      return { ...base, ...overlay };
    case 'base':
      return { ...overlay, ...base };
    case 'merge':
    default:
      const merged: Frontmatter = { ...base };
      for (const [key, value] of Object.entries(overlay)) {
        if (value !== undefined && value !== '') {
          merged[key] = value;
        }
      }
      return merged;
  }
}

