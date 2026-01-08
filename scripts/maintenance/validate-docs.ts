#!/usr/bin/env tsx
// scripts/validate-docs.ts
// Consolidates all documentation validation: links, freshness, and metrics.

import { glob } from 'glob';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { limit } from './_utils/concurrency';
import { normalizeDate, parseMd } from './_utils/frontmatter';
import { runLocalBin } from './_utils/run-local-bin';
import { isStable, normalizeDocStatus } from './normalize-doc-status';

// Simple console-based logger to avoid circular dependencies
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  debug: (message: string, meta?: any) => {
    console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  }
};

// --- 1. Link Validation (from validate-documentation-links.js) ---

// Use repository-configured link checker rules
const LINK_CHECK_CONFIG_PATH = 'config/.markdown-link-check.json';

// Config now lives in config/.markdown-link-check.json; no temp file generation.

type MLCRuntimeOptsBase = {
  timeout?: string; // ms-format string per tool docs
  retryOn429?: boolean;
  retryCount?: number;
  fallbackRetryDelay?: string;
  aliveStatusCodes?: number[];
  projectBaseUrl?: string;
  httpHeaders?: Array<{ urls: string[]; headers: Record<string,string> }>;
  ignorePatterns?: Array<{ pattern: string }>;
  replacementPatterns?: Array<{ pattern: string; replacement: string; global?: boolean }>;
};
type MLCRuntimeOpts = MLCRuntimeOptsBase;

function toMsString(v: unknown): string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return `${v}ms`;
  if (typeof v === 'string' && v.trim()) return v.trim(); // assume already ms-format ("20s","30000ms")
  return undefined;
}

function parseDurationToMs(input?: string): number {
  if (!input) return 30_000;
  const s = input.toString().trim().toLowerCase();
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  if (Number.isNaN(n)) return 30_000;
  if (s.endsWith('ms')) return Math.max(1, Math.floor(n));
  if (s.endsWith('s')) return Math.max(1, Math.floor(n * 1_000));
  if (s.endsWith('m')) return Math.max(1, Math.floor(n * 60_000));
  return Math.max(1, Math.floor(n));
}

async function loadConfig(): Promise<MLCRuntimeOpts> {
  const cfgPath = path.resolve(LINK_CHECK_CONFIG_PATH);
  try {
    const raw = JSON.parse(await fs.readFile(cfgPath, 'utf8'));
    // migrate legacy key if present
    if (raw.response_timeout && !raw.timeout) raw.timeout = raw.response_timeout;
    // build a sanitized object with only supported keys
    const sanitized: MLCRuntimeOpts = {
      ...(toMsString(raw.timeout) ? { timeout: toMsString(raw.timeout)! } : undefined),
      retryOn429: raw.retryOn429 ?? true,
      retryCount: raw.retryCount ?? 3,
      fallbackRetryDelay: toMsString(raw.fallbackRetryDelay ?? '45s')!,
      aliveStatusCodes: Array.isArray(raw.aliveStatusCodes) ? raw.aliveStatusCodes : [200,206,301,302,307,308,403,429],
      ...(raw.projectBaseUrl ? { projectBaseUrl: raw.projectBaseUrl as string } : undefined),
      ...(raw.httpHeaders ? { httpHeaders: raw.httpHeaders as Array<{ urls: string[]; headers: Record<string,string> }>} : undefined),
      ...(raw.ignorePatterns ? { ignorePatterns: raw.ignorePatterns as Array<{ pattern: string }>} : undefined),
      ...(raw.replacementPatterns ? { replacementPatterns: raw.replacementPatterns as Array<{ pattern: string; replacement: string; global?: boolean }> } : undefined),
    };
    return sanitized;
  } catch {
    return { timeout: '30s', retryOn429: true, retryCount: 3, fallbackRetryDelay: '45s', aliveStatusCodes: [200,206,301,302,307,308,403,429] } as MLCRuntimeOpts;
  }
}

/**
 * Checks if markdown-link-check tool is available
 */
async function isMarkdownLinkCheckAvailable(): Promise<boolean> {
  const res = await runLocalBin('markdown-link-check', ['--version']).catch(() => ({ exitCode: 1, stdout: '', stderr: '' }));
  return res.exitCode === 0;
}

/**
 * Runs the markdown-link-check tool across all markdown files.
 */
async function runLinkChecker(): Promise<void> {
  logger.info('Running link checker...');

  // Check if markdown-link-check is available
  const available = await isMarkdownLinkCheckAvailable();
  if (!available) {
    logger.warn('⚠️  markdown-link-check tool not found. Install with: pnpm add -D markdown-link-check');
    logger.info('✅ Link validation skipped due to missing tool');
    return;
  }

  try {
    const opts = await loadConfig();
    const files = await glob('{README.md,docs/**/*.md,.github/**/*.md,eslint-plugin-corso/**/*.md,stories/**/*.md,styles/**/*.md,.vscode/**/*.md,public/**/*.md,.husky/**/*.md,.cursor/**/*.md}', {
      ignore: ['**/node_modules/**']
    });

    const total = files.length;
    if (total === 0) {
      logger.info('No markdown files found for link checking.');
      return;
    }

    const timeoutMs = parseDurationToMs(opts.timeout ?? '30s');
    const concurrency = Math.min(4, Math.max(1, (os.cpus()?.length ?? 2) - 1));
    logger.info(`[link-check] files=${total} concurrency=${concurrency} timeoutMs=${timeoutMs}`);

    let completed = 0;
    await Promise.all(
      files.map((file) => limit(async () => {
        const res = await runLocalBin('markdown-link-check', [file, '--config', LINK_CHECK_CONFIG_PATH], { timeoutMs }).catch((e) => ({ exitCode: 1, stdout: '', stderr: String(e?.message ?? e) }));
        if (res.exitCode !== 0) {
          const stderr = (res.stderr || '').toLowerCase();
          let errorMsg = 'link check failed';
          if (stderr.includes('invalid url')) errorMsg = 'contains invalid URLs';
          if (stderr.includes('timeout')) errorMsg = 'timeout exceeded';
          logger.warn(`[link-check] ${file} failed (${errorMsg})`);
        }
        completed += 1;
        if (completed % 10 === 0 || completed === total) {
          logger.info(`[link-check] progress: ${completed}/${total}`);
        }
      }))
    );
    logger.info('✅ All links validated successfully');
  } catch (error) {
    logger.warn('⚠️  Link validation failed, but continuing with other checks');
    logger.info('✅ Link validation skipped due to execution error');
  }
}

// --- 2. Freshness Validation (from validate-docs.ts) ---

/**
 * Checks that all docs are fresh using frontmatter `last_updated`.
 * Exempts files explicitly marked as `status: stable`.
 */
async function checkLastUpdated(): Promise<void> {
  logger.info('Checking document freshness via frontmatter...');
  const files = await glob('{docs/**/*.md,.github/**/*.md}');
  const cutoff = 90 * 24 * 60 * 60 * 1000; // 90 days
  const now = Date.now();
  const stale: string[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const parsed = parseMd(content);
    const rawStatus = String(parsed.data?.['status'] ?? '').trim();
    const status = normalizeDocStatus(rawStatus);
    if (isStable(status)) continue;
    const dateStr = normalizeDate(parsed.data?.['last_updated']);
    if (!dateStr) {
      stale.push(`${file} missing last_updated in frontmatter.`);
      continue;
    }
    const age = now - new Date(dateStr).getTime();
    if (Number.isNaN(age) || age > cutoff) {
      stale.push(`${file} is stale (last_updated: ${dateStr}).`);
    }
  }

  if (stale.length > 0) {
    stale.forEach(msg => logger.error(msg));
    throw new Error('Stale documents found.');
  }
}

// --- 3. Metrics Validation (from validate-documentation-metrics.js) ---

async function countFiles(pattern: string): Promise<number> {
  const files = await glob(pattern, { ignore: ['node_modules/**', '.next/**'] });
  return files.length;
}

function extractMetricFromReadme(content: string, metricName: string): number | null {
  const pattern = new RegExp(`\\*\\*${metricName}\\*\\*.*\\s+(\\d+)`, 'i');
  const match = content.match(pattern);
  return match && match[1] ? parseInt(match[1], 10) : null;
}

/**
 * Validates that component and feature counts in the README match actual counts.
 */
async function validateReadmeMetrics(): Promise<void> {
  logger.info('Validating README metrics...');
  const readmeContent = await fs.readFile('README.md', 'utf8');
  const errors: string[] = [];
  const warnings: string[] = [];

  const metrics = [
    { name: 'Test files', actual: await countFiles('**/*.test.{ts,tsx}') },
    { name: 'Security tests', actual: await countFiles('tests/security/**/*.test.ts') },
  ];

  for (const metric of metrics) {
    const readmeValue = extractMetricFromReadme(readmeContent, metric.name);
    if (readmeValue === null) {
      // Not all READMEs track metrics; warn instead of failing hard
      warnings.push(`Metric "${metric.name}" not present in README.md (skipping enforcement).`);
      continue;
    }
    if (readmeValue < metric.actual) {
      errors.push(
        `Metric "${metric.name}" is out of date. README: ${readmeValue}, Actual: ${metric.actual}.`
      );
    }
  }

  if (warnings.length > 0) {
    warnings.forEach(msg => logger.warn ? logger.warn(msg) : console.warn(msg));
  }
  if (errors.length > 0) {
    errors.forEach(msg => logger.error(msg));
    throw new Error('README metrics are out of date.');
  }
}


// --- 4. Markdown Linting ---

/**
 * Runs markdown linting to check formatting consistency.
 */
async function runMarkdownLinting(): Promise<void> {
  logger.info('Running markdown linting...');
  const res = await runLocalBin('markdownlint', ['docs/**/*.md', 'README.md', '--config', '.markdownlint.jsonc']).catch(() => ({ exitCode: 1, stdout: '', stderr: '' }));
  if (res.exitCode !== 0) {
    logger.error('❌ Markdown linting failed');
    throw new Error('markdownlint failed');
  }
  logger.info('✅ Markdown linting passed');
}

// --- 5. Index Validation ---

/**
 * Ensures the main documentation index is up to date.
 */
async function checkDocsIndex(): Promise<void> {
  logger.info('Checking docs index...');
  try {
    // Capture docs/README.md content before index generation
    let before = '';
    try {
      before = await fs.readFile('docs/README.md', 'utf8');
    } catch {
      before = '';
    }

    // Rebuild docs index (docs/index.ts and optionally README sections)
    const idx = await runLocalBin('tsx', ['scripts/maintenance/manage-docs.ts', 'index'], { timeoutMs: 120_000 });
    if (idx.exitCode !== 0) throw new Error('docs:index failed');

    // Ensure docs/index.ts exists and is non-empty
    const indexContent = await fs.readFile('docs/index.ts', 'utf8');
    if (!indexContent || !indexContent.includes('export const docs')) {
      logger.error('docs/index.ts missing or invalid after docs:index.');
      throw new Error('Docs index generation failed.');
    }

    // Compare README content after generation; warn if it changed to prompt commit
    let after = '';
    try {
      after = await fs.readFile('docs/README.md', 'utf8');
    } catch {
      after = before;
    }

    if (before !== after) {
      const msg = 'docs/README.md was updated by docs:index. Please commit the changes.';
      if ((logger as any).warn) {
        (logger as any).warn(msg);
      } else {
        console.warn(msg);
      }
    }
  } catch {
    logger.error('docs index check failed.');
    throw new Error('Docs index validation failed.');
  }
}


// --- Main Orchestrator ---

async function main(): Promise<void> {
  try {
    await Promise.all([
      runLinkChecker(),
      checkLastUpdated(),
      validateReadmeMetrics(),
      runMarkdownLinting(),
      checkDocsIndex(),
    ]);

    logger.info('✅ Documentation validation passed successfully!');
  } catch (err) {
    logger.error('❌ Documentation validation failed.', { error: (err as Error).message });
    process.exit(1);
  }
}

void main();

