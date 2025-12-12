/**
 * @fileoverview Markdown transformation utilities for docs maintenance
 * @description Common markdown content transformations and idempotency checks
 */

import type { MarkdownFile, TransformResult } from '../types';
import { MARKDOWN_TRANSFORM_MARKERS } from '../constants';

/**
 * Transforms markdown content with various operations
 */
export function transformMarkdown(
  content: string,
  transformations: Array<{
    pattern: string;
    replacement: string;
    description: string;
  }>
): string {
  let transformed = content;

  for (const transform of transformations) {
    const regex = new RegExp(transform.pattern, 'g');
    transformed = transformed.replace(regex, transform.replacement);
  }

  return transformed;
}

/**
 * Checks if a transformation is idempotent (applying it twice yields same result)
 */
export function isIdempotentTransform(
  content: string,
  transform: (content: string) => string
): boolean {
  const once = transform(content);
  const twice = transform(once);
  return once === twice;
}

/**
 * Replaces content between markers
 */
export function replaceBetweenMarkers(
  content: string,
  markerName: string,
  replacement: string
): string {
  const openMarker = `<!-- BEGIN:${markerName} -->`;
  const closeMarker = `<!-- END:${markerName} -->`;

  const openIndex = content.indexOf(openMarker);
  const closeIndex = content.indexOf(closeMarker);

  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return content;
  }

  const before = content.slice(0, openIndex + openMarker.length);
  const after = content.slice(closeIndex);

  return before + '\n' + replacement.trim() + '\n' + after;
}

/**
 * Inserts content after a marker if it doesn't exist
 */
export function insertAfterMarker(
  content: string,
  marker: string,
  insertion: string,
  options: { skipIfExists?: boolean } = {}
): string {
  const markerIndex = content.indexOf(marker);

  if (markerIndex === -1) {
    return content;
  }

  if (options.skipIfExists && content.includes(insertion)) {
    return content;
  }

  const afterMarker = content.slice(markerIndex + marker.length);
  return content.slice(0, markerIndex + marker.length) + '\n' + insertion + afterMarker;
}

/**
 * Extracts content between markers
 */
export function extractBetweenMarkers(
  content: string,
  markerName: string
): string | null {
  const openMarker = `<!-- BEGIN:${markerName} -->`;
  const closeMarker = `<!-- END:${markerName} -->`;

  const openIndex = content.indexOf(openMarker);
  const closeIndex = content.indexOf(closeMarker);

  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return null;
  }

  return content.slice(openIndex + openMarker.length, closeIndex).trim();
}

/**
 * Checks if content has markers
 */
export function hasMarkers(content: string, markerName: string): boolean {
  const openMarker = `<!-- BEGIN:${markerName} -->`;
  const closeMarker = `<!-- END:${markerName} -->`;
  return content.includes(openMarker) && content.includes(closeMarker);
}

/**
 * Generates a table of contents from markdown headings
 */
export function generateTableOfContents(content: string): string {
  const headings: Array<{ level: number; text: string; anchor: string }> = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1]?.length ?? 0;
    const text = match[2]?.trim() ?? '';
    const anchor = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    headings.push({ level, text, anchor });
  }

  if (headings.length === 0) {
    return '';
  }

  const tocLines = headings.map(heading => {
    const indent = '  '.repeat(heading.level - 1);
    return `${indent}- [${heading.text}](#${heading.anchor})`;
  });

  return '## Table of Contents\n\n' + tocLines.join('\n') + '\n';
}

/**
 * Adds or updates table of contents in markdown
 */
export function updateTableOfContents(content: string): string {
  const toc = generateTableOfContents(content);
  if (!toc) {
    return content;
  }

  return replaceBetweenMarkers(content, 'toc', toc);
}

/**
 * Generates exports table for a domain
 */
export function generateExportsTable(
  exports: string[],
  domain: string,
  importPath: string
): string {
  if (exports.length === 0) {
    return `| ${domain} | Purpose | Import Path |\n|--------|---------|-------------|\n| No exports found | | |`;
  }

  const rows = exports.map(exp => `| \`${exp}\` |  | \`${importPath}\` |`).join('\n');
  return `| ${domain} | Purpose | Import Path |\n|--------|---------|-------------|\n${rows}`;
}

/**
 * Updates exports table in markdown content
 */
export function updateExportsTable(
  content: string,
  tableContent: string
): string {
  return replaceBetweenMarkers(content, 'exports-table', tableContent);
}

/**
 * Checks if markdown content has been enhanced (contains required sections)
 */
export function isMarkdownEnhanced(content: string): boolean {
  const requiredPatterns = [
    MARKDOWN_TRANSFORM_MARKERS.exportsTable,
    MARKDOWN_TRANSFORM_MARKERS.toc,
  ];

  return requiredPatterns.some(marker => hasMarkers(content, marker.replace('<!-- ', '').replace(' -->', '')));
}

/**
 * Enhances markdown content with standard sections
 */
export function enhanceMarkdownContent(
  content: string,
  options: {
    title?: string;
    description?: string;
    exportsTable?: string;
    toc?: boolean;
  } = {}
): string {
  let enhanced = content;

  // Add table of contents if requested
  if (options.toc) {
    enhanced = updateTableOfContents(enhanced);
  }

  // Add exports table if provided
  if (options.exportsTable) {
    enhanced = updateExportsTable(enhanced, options.exportsTable);
  }

  return enhanced;
}

