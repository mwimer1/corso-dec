#!/usr/bin/env tsx
/**
 * @fileoverview Stale Documentation Checker
 * @description Scans documentation files and flags ones not updated recently (>90 days old) that are still in draft status.
 *
 * Usage:
 *   pnpm docs:stale        # Run stale documentation check (reports if any outdated docs)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isStable, normalizeDocStatus } from './normalize-doc-status';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DAYS_THRESHOLD = 90;
const now = new Date();

// Directories to check for stale documentation
const DOCS_DIRS = [
  path.resolve(PROJECT_ROOT, 'docs'),
  path.resolve(PROJECT_ROOT, '.github'),  // Include GitHub directory READMEs
  path.resolve(PROJECT_ROOT, 'eslint-plugin-corso'),  // Include ESLint plugin READMEs
  path.resolve(PROJECT_ROOT, 'stories'),  // Include Stories directory READMEs
  path.resolve(PROJECT_ROOT, 'styles'),  // Include Styles directory READMEs
  path.resolve(PROJECT_ROOT, '.vscode'),  // Include VSCode directory READMEs
  path.resolve(PROJECT_ROOT, 'public'),  // Include Public assets directory READMEs
  path.resolve(PROJECT_ROOT, '.husky'),  // Include Husky hooks directory READMEs
  path.resolve(PROJECT_ROOT, '.cursor'),  // Include Cursor AI rules directory READMEs
];

function getAllMarkdownFiles(dirs: string[]): string[] {
  let results: string[] = [];
  
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      results = results.concat(getAllMarkdownFilesFromDir(dir));
    }
  }
  
  return results;
}

function getAllMarkdownFilesFromDir(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFilesFromDir(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  }
  
  return results;
}

function parseFrontMatter(content: string) {
  // Support frontmatter blocks not at file start (e.g., after doctoc comments)
  const start = content.indexOf('\n---');
  const altStart = content.startsWith('---') ? 0 : (start >= 0 ? start + 1 : -1);
  const fmStart = altStart >= 0 ? altStart : content.indexOf('---');
  if (fmStart < 0) return {};
  const fmEnd = content.indexOf('\n---', fmStart + 3);
  if (fmEnd < 0) return {};
  const block = content.slice(fmStart + 3, fmEnd).trim();
  const lines = block.split('\n');
  const data: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
    if (m && m[1] && m[2] !== undefined) {
      data[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
    }
  }
  return data;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

// Handle --help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: pnpm docs:stale

Checks for stale documentation files (>90 days old) that are still in draft status.
Exits with code 1 if any stale files are found, otherwise exits with code 0.

Currently no additional flags are available.
`);
  process.exit(0);
}

const files = getAllMarkdownFiles(DOCS_DIRS);
const stale: { file: string; last_updated: string; days: number; status: string }[] = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const fm = parseFrontMatter(content);
  if (!fm['last_updated']) continue;
  const rawStatus = (fm['status'] ?? '').toString().trim();
  const status = normalizeDocStatus(rawStatus);
  if (isStable(status)) continue;
  const last = new Date(fm['last_updated']);
  const days = daysBetween(now, last);
  if (days > DAYS_THRESHOLD) {
    stale.push({ file: path.relative(process.cwd(), file), last_updated: fm['last_updated'], days, status: fm['status'] || '' });
  }
}

if (stale.length) {
  console.error('Stale documentation files (>90 days old):');
  for (const s of stale) {
    console.error(`- ${s.file} (last_updated: ${s.last_updated}, ${s.days} days ago, status: ${s.status})`);
  }
  process.exit(1);
} else {
  console.log('All documentation files are fresh.');
} 

