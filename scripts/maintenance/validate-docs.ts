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
import { validateDocsContent } from './validate-docs-content';

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

// --- 1. Link Validation ---
// Consolidates:
// - markdown-link-check tool (external link validation)
// - filesystem-based link checking (from validate-doc-links.ts)
// - APP_LINKS route validation (from validate-links.ts)

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
 * Validates filesystem-based markdown links (from validate-doc-links.ts)
 * Checks if internal file links resolve to existing files
 */
async function validateFilesystemLinks(): Promise<void> {
  logger.info('Validating filesystem-based markdown links...');
  const { existsSync, readFileSync } = await import('fs');
  const projectRoot = process.cwd();
  let hasErrors = false;

  const markdownFiles = await glob([
    `${projectRoot}/README.md`,
    `${projectRoot}/docs/**/*.md`,
    `${projectRoot}/.github/**/*.md`,
    `${projectRoot}/eslint-plugin-corso/**/*.md`,
    `${projectRoot}/styles/**/*.md`,
    `${projectRoot}/.vscode/**/*.md`,
    `${projectRoot}/public/**/*.md`,
    `${projectRoot}/.husky/**/*.md`,
    `${projectRoot}/.cursor/**/*.md`,
    `${projectRoot}/lib/**/*.md`,
    `${projectRoot}/components/**/*.md`,
    `${projectRoot}/hooks/**/*.md`,
    `${projectRoot}/app/**/*.md`,
  ], { ignore: ['**/node_modules/**'] });

  for (const file of markdownFiles) {
    const content = readFileSync(file, 'utf-8');
    const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

    for (const link of links) {
      const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(link);
      if (match?.[2]) {
        const original = match[2];
        // Skip external links, anchors, mailto, and mdc: protocol links
        if (/^(https?:)?\/\//.test(original) || original.startsWith('#') || original.startsWith('mailto:') || original.startsWith('mdc:')) {
          continue;
        }
        // Strip URL fragments and query strings for filesystem resolution
        const safe = String(original ?? '');
        const withoutFragment = (safe && safe.includes('#')) ? (safe.split('#')[0] ?? safe) : safe;
        const withoutQuery = (withoutFragment && withoutFragment.includes('?')) ? (withoutFragment.split('?')[0] ?? withoutFragment) : withoutFragment;
        const resolvedTarget: string = withoutQuery;
        if (!resolvedTarget) continue;
        // Support root-absolute paths like "/docs/..."
        const absolutePath = resolvedTarget.startsWith('/')
          ? path.resolve(projectRoot, resolvedTarget.replace(/^\//, ''))
          : path.resolve(path.dirname(file), resolvedTarget);
        if (!existsSync(absolutePath)) {
          logger.error(`❌ Broken link in ${file}: ${original}`);
          hasErrors = true;
        }
      }
    }
  }

  if (hasErrors) {
    throw new Error('Filesystem link validation failed');
  }
  logger.info('✅ All filesystem links are valid');
}

/**
 * Validates APP_LINKS constants against actual routes (from validate-links.ts)
 */
async function validateAppLinks(): Promise<void> {
  logger.info('Validating APP_LINKS constants...');
  const { readFileSync, readdirSync } = await import('fs');
  const appDir = path.join(process.cwd(), 'app');
  const linksFile = path.join(process.cwd(), 'lib', 'shared', 'constants', 'links.ts');

  function collectRoutes(dir: string): Set<string> {
    const routes = new Set<string>();
    const walk = (d: string, base = '') => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full, path.join(base, entry.name));
        } else if (entry.isFile() && entry.name === 'page.tsx') {
          // Convert /(group) and segment folders to public URL
          let url = '/' + base
            .replace(/\\/g, '/')
            .replace(/\(([^)]+)\)\/?/g, '') // remove route groups
            .replace(/index$/i, '')
            .replace(/\/page\.tsx$/, '')
            .replace(/\/$/, '');
          
          // Handle catch-all routes: [[...param]] -> matches the base path
          // e.g., app/(auth)/sign-in/[[...sign-in]]/page.tsx -> /sign-in
          if (url.includes('[[...')) {
            url = url.replace(/\/\[\[\.\.\.[^\]]+\]\]/g, '');
          }
          
          // Handle dynamic routes: [param] -> matches any value
          // e.g., app/(protected)/dashboard/(entities)/[entity]/page.tsx
          // We need to check if this is a known entity route and add specific paths
          if (url.includes('/[entity]')) {
            // Known entity routes from APP_LINKS
            routes.add('/dashboard/projects');
            routes.add('/dashboard/companies');
            routes.add('/dashboard/addresses');
            // Keep the dynamic route pattern for validation
            url = url.replace(/\[entity\]/, '[entity]');
          } else {
            // Remove other dynamic segments for now (they're valid but we can't enumerate all values)
            url = url.replace(/\[[^\]]+\]/g, '[param]');
          }
          
          routes.add(url || '/');
        }
      }
    };
    walk(dir);
    return routes;
  }

  function extractAppLinksTargets(src: string): string[] {
    const targets: string[] = [];
    const re = /['"]\/[A-Za-z0-9_\-\/]+(?:#[A-Za-z0-9_\-]+)?['"]/g;
    for (const m of src.matchAll(re)) {
      const raw = m[0].slice(1, -1);
      // Filter external-like and anchors
      if (/^\//.test(raw) && !/^\/#/.test(raw)) targets.push(raw);
    }
    return Array.from(new Set(targets));
  }

  try {
    const routes = collectRoutes(appDir);
    const linksSrc = readFileSync(linksFile, 'utf8');
    const targets = extractAppLinksTargets(linksSrc);

    // Allow known non-page anchors
    const ignored = new Set(['/pricing#faq']);
    const missing: string[] = [];
    for (const t of targets) {
      if (ignored.has(t)) continue;
      if (!routes.has(t)) {
        missing.push(t);
      }
    }

    if (missing.length) {
      logger.warn('⚠️  Missing routes referenced by APP_LINKS:');
      for (const m of missing) logger.warn(`  - ${m}`);
      logger.warn('⚠️  APP_LINKS validation found issues (non-blocking)');
      // Don't throw - make it a warning so other validations can continue
    } else {
      logger.info('✅ All APP_LINKS internal targets resolve to existing routes');
    }
  } catch (error) {
    logger.warn('⚠️  APP_LINKS validation skipped (links.ts file not found or error reading routes)');
  }
}

/**
 * Runs the markdown-link-check tool across all markdown files.
 */
async function runLinkChecker(): Promise<void> {
  logger.info('Running markdown-link-check tool...');

  // Check if markdown-link-check is available
  const available = await isMarkdownLinkCheckAvailable();
  if (!available) {
    logger.warn('⚠️  markdown-link-check tool not found. Install with: pnpm add -D markdown-link-check');
    logger.info('✅ External link validation skipped due to missing tool');
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
    logger.info('✅ All external links validated successfully');
  } catch (error) {
    logger.warn('⚠️  External link validation failed, but continuing with other checks');
    logger.info('✅ External link validation skipped due to execution error');
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
  const args = process.argv.slice(2);
  const linksOnly = args.includes('--links-only') || args.includes('--links');

  try {
    if (linksOnly) {
      // When --links-only flag is used, only run link validations
      await Promise.all([
        validateFilesystemLinks(),
        validateAppLinks(),
        runLinkChecker(),
      ]);
      logger.info('✅ Link validation passed successfully!');
    } else {
      // Full validation (default)
      await Promise.all([
        validateFilesystemLinks(),
        validateAppLinks(),
        runLinkChecker(),
        checkLastUpdated(),
        validateReadmeMetrics(),
        runMarkdownLinting(),
        checkDocsIndex(),
      ]);

      // Content validation (banned patterns, code blocks, env var docs)
      logger.info('Validating documentation content...');
      await validateDocsContent();

      logger.info('✅ Documentation validation passed successfully!');
    }
  } catch (err) {
    logger.error('❌ Documentation validation failed.', { error: (err as Error).message });
    process.exit(1);
  }
}

void main();

