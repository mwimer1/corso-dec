#!/usr/bin/env tsx
/**
 * Common utilities for documentation maintenance scripts
 * Consolidates patterns used across generate-readme.ts and enhance-readmes.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export interface ReadmeMetadata {
  title: string;
  description: string;
  directory: string;
  category: string;
  lastUpdated: string;
}

export interface DocsProcessingResult {
  success: boolean;
  message: string;
  processedFiles: number;
  errors: string[];
}

/**
 * Common pattern for building exports list
 * Note: For reading barrel exports, import directly from '../utils/barrel-utils'
 */
export function buildExportsList(domain: string, exports: string[]): string[] {
  if (exports.length === 0) {
    return [`No exports found in ${domain}`];
  }
  
  return exports.map(exp => `- \`${exp}\``);
}

/**
 * Common pattern for updating README content
 */
export async function updateReadmeContent(
  readmePath: string,
  tableContent: string,
  sectionMarker: string = '<!-- EXPORTS_TABLE -->'
): Promise<boolean> {
  try {
    const content = await fs.readFile(readmePath, 'utf8');
    
    if (content.includes(sectionMarker)) {
      // Replace existing section
      const regex = new RegExp(`${sectionMarker}[\\s\\S]*?${sectionMarker}`, 'g');
      const newContent = content.replace(regex, `${sectionMarker}\n${tableContent}\n${sectionMarker}`);
      await fs.writeFile(readmePath, newContent, 'utf8');
      return true;
    } else {
      // Add new section at the end
      const newContent = `${content}\n\n${sectionMarker}\n${tableContent}\n${sectionMarker}`;
      await fs.writeFile(readmePath, newContent, 'utf8');
      return true;
    }
  } catch {
    return false;
  }
}

/**
 * Common pattern for categorizing directories
 */
export function categorizeDirectory(dirPath: string): string {
  if (dirPath.includes('/components/')) {
    return 'components';
  } else if (dirPath.includes('/lib/')) {
    return 'library';
  } else if (dirPath.includes('/actions/')) {
    return 'actions';
  } else if (dirPath.includes('/hooks/')) {
    return 'hooks';
  } else if (dirPath.includes('/contexts/')) {
    return 'contexts';
  } else if (dirPath.includes('/types/')) {
    return 'types';
  } else if (dirPath.includes('/utils/')) {
    return 'utilities';
  } else {
    return 'other';
  }
}

/**
 * Common pattern for generating titles
 */
export function generateTitle(filePath: string): string {
  const dirName = path.basename(path.dirname(filePath));
  const category = categorizeDirectory(filePath);
  
  return `${dirName.charAt(0).toUpperCase() + dirName.slice(1)} (${category})`;
}

/**
 * Common pattern for generating descriptions
 */
export function generateDescription(filePath: string, title: string): string {
  const category = categorizeDirectory(filePath);
  
  const descriptions: Record<string, string> = {
    components: 'React components and UI elements',
    library: 'Core library functions and utilities',
    actions: 'Server actions and API endpoints',
    hooks: 'React hooks and state management',
    contexts: 'React context providers and consumers',
    types: 'TypeScript type definitions',
    utilities: 'Helper functions and utilities',
    other: 'Additional functionality and resources'
  };
  
  return descriptions[category] || 'Documentation and resources';
}

/**
 * Common pattern for checking if README is already enhanced
 */
export function isAlreadyEnhanced(content: string): boolean {
  return content.includes('<!-- EXPORTS_TABLE -->') || 
         content.includes('last_updated:') ||
         content.includes('category:');
}

/**
 * Common pattern for processing documentation files
 */
export async function processDocsFiles(
  processor: (filePath: string, content: string) => Promise<DocsProcessingResult>,
  patterns: string[] = ['**/README.md'],
  ignore: string[] = ['node_modules/**', '.next/**', 'dist/**']
): Promise<DocsProcessingResult[]> {
  const { globby } = await import('globby');
  const files = await globby(patterns, { ignore, absolute: true });
  const results: DocsProcessingResult[] = [];

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const result = await processor(filePath, content);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        message: `Failed to process ${filePath}`,
        processedFiles: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  return results;
}

