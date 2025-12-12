/**
 * @fileoverview Link utilities for docs maintenance
 * @description Link fixing and validation for markdown files
 */

import fsSync from 'node:fs';
import path from 'node:path';
import { isNonEmptyString } from '../../_utils/guards';
import { LINK_FIX_PATTERNS } from '../constants';
import type { LinkFix, LinkValidationResult, MarkdownFile, TransformResult } from '../types';

/**
 * Fixes broken links in markdown content using predefined patterns
 */
export function fixLinks(content: string, fixes: readonly LinkFix[] = LINK_FIX_PATTERNS): string {
  let fixedContent = content;

  for (const fix of fixes) {
    const regex = new RegExp(fix.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    fixedContent = fixedContent.replace(regex, fix.replacement);
  }

  return fixedContent;
}

/**
 * Validates internal links in markdown content
 */
export function validateLinks(content: string, filePath: string): LinkValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract all markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const [, text, url] = match;
    if (text && url) {

    // Skip external links and anchors
    if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:')) {
      continue;
    }

    // Check if the referenced file exists
    const resolvedPath = resolveLinkPath(url, filePath);
      if (resolvedPath && !fsSync.existsSync(resolvedPath)) {
        errors.push(`Broken link: ${text} -> ${url} (resolved to: ${resolvedPath})`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Resolves a link path relative to the markdown file
 */
function resolveLinkPath(linkPath: string, markdownFilePath: string): string | null {
  try {
    // Handle absolute paths (starting with /)
    if (linkPath.startsWith('/')) {
      return path.resolve(process.cwd(), linkPath.slice(1));
    }

    // Handle relative paths
    const markdownDir = path.dirname(markdownFilePath);
    return path.resolve(markdownDir, linkPath);
  } catch {
    return null;
  }
}

/**
 * Fixes links in a markdown file
 */
export function fixLinksInFile(file: MarkdownFile, fixes: readonly LinkFix[] = LINK_FIX_PATTERNS): TransformResult {
  try {
    const originalContent = file.content;
    const fixedContent = fixLinks(originalContent, fixes);

    return {
      content: fixedContent,
      changed: fixedContent !== originalContent,
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
 * Validates links in a markdown file
 */
export function validateLinksInFile(file: MarkdownFile): LinkValidationResult {
  return validateLinks(file.content, file.path);
}

/**
 * Finds all markdown links in content
 */
export function findMarkdownLinks(content: string): Array<{ text: string; url: string; position: number }> {
  const links: Array<{ text: string; url: string; position: number }> = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const text = match[1];
    const url = match[2];
    if (isNonEmptyString(text) && isNonEmptyString(url)) {
      links.push({
        text,
        url,
        position: match.index,
      });
    }
  }

  return links;
}

/**
 * Checks if a link is external (http/https)
 */
export function isExternalLink(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Checks if a link is an anchor (fragment)
 */
export function isAnchorLink(url: string): boolean {
  return url.startsWith('#');
}

/**
 * Checks if a link is a mailto link
 */
export function isMailtoLink(url: string): boolean {
  return url.startsWith('mailto:');
}

/**
 * Checks if a link is internal (relative path)
 */
export function isInternalLink(url: string): boolean {
  return !isExternalLink(url) && !isAnchorLink(url) && !isMailtoLink(url);
}

