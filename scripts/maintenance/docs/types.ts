/**
 * @fileoverview Type definitions for docs maintenance tools
 * @description Shared types and interfaces for documentation operations
 */

export interface MarkdownFile {
  path: string;
  content: string;
  frontmatter: Frontmatter;
}

export interface Frontmatter {
  title?: string;
  description?: string;
  category?: string;
  last_updated?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface TransformResult {
  content: string;
  changed: boolean;
  errors: string[];
}

export interface LinkFix {
  pattern: string;
  replacement: string;
  description: string;
}

export interface LinkValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Task options
export interface BaseOptions {
  check?: boolean;
  write?: boolean;
  verbose?: boolean;
  include?: string[];
  exclude?: string[];
}

export interface GenerateOptions extends BaseOptions {
  domains?: string[];
  skipExisting?: boolean;
}

export interface EnhanceOptions extends BaseOptions {
  skipExisting?: boolean;
}

export interface NormalizeOptions extends BaseOptions {
  force?: boolean;
}

export interface FixLinksOptions extends BaseOptions {
  dryRun?: boolean;
}

// Task function signatures
export type DocsTask<T extends BaseOptions = BaseOptions> = (options: T) => Promise<TransformResult[]>;

export type GenerateTask = DocsTask<GenerateOptions>;
export type EnhanceTask = DocsTask<EnhanceOptions>;
export type NormalizeTask = DocsTask<NormalizeOptions>;
export type FixLinksTask = DocsTask<FixLinksOptions>;

// CLI command configuration
export interface CommandConfig {
  name: string;
  description: string;
  examples: string[];
  options: Record<string, string>;
}

// Task registry
export interface TaskRegistry {
  generate: GenerateTask;
  enhance: EnhanceTask;
  normalize: NormalizeTask;
  fixLinks: FixLinksTask;
}

// File selection result
export interface FileSelection {
  files: MarkdownFile[];
  excluded: string[];
  errors: string[];
}

