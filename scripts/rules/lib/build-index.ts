// scripts/rules/lib/build-index.ts
// Shared library for building cursor rules index files

import matter from 'gray-matter';
import fs from 'node:fs';
import path from 'node:path';

export interface RuleIndexItem {
  rule_id: string;
  file: string;
  title: string;
  status: string;
  last_reviewed: string;
  alwaysApply: boolean;
}

export interface MinimalIndexItem {
  generatedAt: string;
  canonical: string;
  files: string[];
}

export interface DetailedIndex {
  generated_at: string;
  count: number;
  rules: RuleIndexItem[];
}

/**
 * Build a detailed index with rule metadata from .mdc files
 */
export function buildDetailedIndex(rulesDir: string): DetailedIndex {
  const IGNORE = new Set(['_snippets.mdc', 'README.md', '_index.json']);
  const IGNORE_DIRS = new Set(['templates']);

  const items: RuleIndexItem[] = [];

  for (const entry of fs.readdirSync(rulesDir)) {
    const full = path.join(rulesDir, entry);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.has(entry)) continue;
      continue;
    }
    if (!entry.endsWith('.mdc')) continue;
    if (IGNORE.has(entry)) continue;

    const raw = fs.readFileSync(full, 'utf8');
    const { data } = matter(raw);

    if (!data?.['rule_id']) continue;

    items.push({
      rule_id: data['rule_id'],
      file: entry,
      title: data['title'] ?? entry,
      status: data['status'] ?? 'draft',
      last_reviewed: data['last_reviewed'] ?? '1970-01-01',
      alwaysApply: !!data['alwaysApply'],
    });
  }

  return {
    generated_at: new Date().toISOString(),
    count: items.length,
    rules: items.sort((a, b) => a.rule_id.localeCompare(b.rule_id)),
  };
}

/**
 * Build a minimal index with just file list
 */
export function buildMinimalIndex(rulesDir: string, canonicalFile: string = 'corso-assistant.mdc'): MinimalIndexItem {
  const files = fs.readdirSync(rulesDir)
    .filter((f) => f !== '_index.json')
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdc'))
    .sort();

  return {
    generatedAt: new Date().toISOString(),
    canonical: canonicalFile,
    files,
  };
}

/**
 * Write index to file
 */
export function writeIndex(indexPath: string, index: DetailedIndex | MinimalIndexItem): void {
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
}

