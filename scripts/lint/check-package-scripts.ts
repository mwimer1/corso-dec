#!/usr/bin/env tsx
/**
 * Script-key linter:
 * - ERROR: same command string defined under multiple script keys (duplicates).
 * - ERROR: script commands reference missing local files.
 * - WARN: non-standard script prefixes (nudges toward a consistent schema).
 * - Guarantees fast feedback on `pnpm lint` via "prelint".
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { readJsonSync } from '../utils/fs/read';

type Pkg = { scripts?: Record<string, string> };
const pkgPath = resolve(process.cwd(), 'package.json');
const repoRoot = dirname(pkgPath);
const pkg = readJsonSync(pkgPath) as Pkg;
const scripts = pkg.scripts ?? {};
const keys = Object.keys(scripts);

// Known binary/package names that should not be validated as file paths
const KNOWN_BINARIES = new Set([
  'eslint', 'prettier', 'next', 'vitest', 'turbo', 'tsc', 'tsx', 'node', 'pnpm',
  'npm', 'yarn', 'rimraf', 'cross-env', 'madge', 'jscpd', 'knip', 'ast-grep',
  'commitlint', 'typecheck', 'ts-node', 'nodemon', 'concurrently', 'husky'
]);

const errors: string[] = [];
const warnings: string[] = [];

// Allowed prefixes (tuned to current repo conventions)
// Expanded to avoid false warnings for legitimate script groups
const allowedPrefixes = [
  'lint', 'typecheck', 'test', 'validate', 'build', 'start', 'dev',
  'ci', 'analysis', 'codemods', 'scripts', 'preview',
  'format', 'prettier', 'openapi', 'knip', 'madge', 'ast-grep', 'jscpd',
  // Newly allowed stable groups
  'a11y', 'audit', 'deps', 'docs', 'env', 'tools', 'cleanup',
  'bundlesize', 'sg', 'scan', 'dedupe', 'gen',
  // Added prefixes to cover all current scripts
  'fix', 'verify', 'plugin', 'guards', 'tailwind', 'hardening', 'update',
  'browsers', 'ast', 'tree', 'jd', 'json', 'lock', 'canary', 'setup',
  'ai', 'maintenance', 'quality', 'dep',
  'check',
  // Allow guard, scaffold, agent and rules groups used in this repo
  'guard', 'scaffold', 'agent', 'rules',
  // Diagnostic scripts for runtime and system checks
  'diag',
  // Monitoring scripts for production health checks
  'monitor',
  // Dead code analysis scripts (e.g., deadcode:test-only finds exports only used in tests)
  // Note: deadcode:test-only is intentionally kept as a specialized tool, distinct from validate:dead-code
  'deadcode'
];
const prefixRe = new RegExp(`^(${allowedPrefixes.join('|')})(:|$)`);

// Canonical names we prefer when duplicates occur
const canonicalKeys = new Set<string>([
  'lint:edge', 'lint:workflows:pnpm',
  'validate', 'validate:dead-code', 'validate:dead-code:all',
  'validate:orphans', 'validate:cycles', 'validate:ts-unused',
  'validate:duplication',
  'ast-grep:scan'
]);

// Known lifecycle scripts to ignore for prefix checking
const lifecycle = new Set([
  'prepare','prepublishOnly','postinstall','postpack','prepack','postversion','preversion','version'
]);
// Additionally allow any npm pre*/post* auto-hooks (e.g., prelint, posttest)
function isLifecycleHook(key: string): boolean {
  return lifecycle.has(key) || key.startsWith('pre') || key.startsWith('post');
}

/**
 * Extracts potential file paths from a command string.
 * Handles quoted paths, Windows separators, and common command patterns.
 */
function extractFilePaths(command: string): string[] {
  const paths: string[] = [];
  
  // Split on command separators (&&, ;) to handle chained commands
  const segments = command.split(/(?:&&|;)/).map(s => s.trim());
  
  for (const segment of segments) {
    // Tokenize: respect quotes but extract tokens
    // Match: "quoted" | 'quoted' | unquoted-token
    const tokenPattern = /"([^"]+)"|'([^']+)'|([^\s]+)/g;
    const tokens: string[] = [];
    let match;
    
    while ((match = tokenPattern.exec(segment)) !== null) {
      const token = match[1] || match[2] || match[3];
      if (token) tokens.push(token);
    }
    
    // Skip command name and flags, look for file paths
    for (const token of tokens) {
      // Skip flags (start with -)
      if (token.startsWith('-')) continue;
      
      // Skip known binaries (exact match or first token)
      if (KNOWN_BINARIES.has(token.split('/').pop()?.split('\\').pop() || '')) continue;
      
      // Skip URLs
      if (token.startsWith('http://') || token.startsWith('https://')) continue;
      
      // Skip env vars
      if (token.startsWith('$') || token.startsWith('%')) continue;
      
      // Skip glob patterns (contain ** or * wildcards)
      if (token.includes('**') || token.includes('*')) continue;
      
      // Skip regex patterns (contain escaped characters like \\. or \|)
      // These are typically search patterns, not file paths
      // Check for common regex escape sequences before normalization
      if (/\\[\\|\.\(\)\[\]\{\}\+\?\^\$]/.test(token) || token.includes('\\\\.') || token.includes('\\|')) continue;
      
      // Normalize for path checking (Windows separators -> forward slashes)
      // But skip if normalization creates malformed paths (indicates regex pattern)
      const normalizedToken = token.replace(/\\/g, '/');
      if (normalizedToken.endsWith('/.ts') || normalizedToken.endsWith('/.js') || normalizedToken.endsWith('/.json')) {
        continue; // Likely a regex pattern that got mangled
      }
      
      // Look for file paths with extensions (use normalized version)
      const fileExtPattern = /\.(ts|tsx|js|mjs|cjs|mts|cts|json)$/i;
      if (fileExtPattern.test(normalizedToken)) {
        paths.push(normalizedToken);
      }
    }
  }
  
  return paths;
}

/**
 * Normalizes a file path and checks if it should be validated.
 * Returns the normalized path if it should be validated, null otherwise.
 */
function normalizeAndValidatePath(candidate: string): string | null {
  // Normalize Windows separators to forward slashes
  let normalized = candidate.replace(/\\/g, '/');
  
  // Remove leading ./
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }
  
  // Skip if empty or malformed
  if (!normalized || normalized === '.' || normalized === '..') {
    return null;
  }
  
  // Only validate paths that look like local repo file references
  // Priority: scripts/** paths (most common), then other top-level dirs
  // Skip node_modules, absolute paths that don't look local, etc.
  const isScriptsPath = normalized.startsWith('scripts/');
  const isTopLevelPath = /^[a-z][a-z0-9_-]*\//i.test(normalized);
  
  if (!isScriptsPath && !isTopLevelPath) {
    return null;
  }
  
  // Additional validation: ensure it looks like a file path (has extension)
  const hasExtension = /\.(ts|tsx|js|mjs|cjs|mts|cts|json)$/i.test(normalized);
  if (!hasExtension) {
    return null;
  }
  
  // Resolve to absolute path
  const absolutePath = resolve(repoRoot, normalized);
  
  // Ensure it's still within repo (basic safety check)
  // Use normalized comparison to handle case-insensitive filesystems
  const repoRootNormalized = repoRoot.replace(/\\/g, '/').toLowerCase();
  const absolutePathNormalized = absolutePath.replace(/\\/g, '/').toLowerCase();
  if (!absolutePathNormalized.startsWith(repoRootNormalized)) {
    return null;
  }
  
  return normalized;
}

/**
 * Validates that all referenced local files in script commands exist.
 * Returns a map of script names to arrays of missing file paths.
 */
function validateScriptTargets(scripts: Record<string, string>): Map<string, string[]> {
  const missingFiles = new Map<string, string[]>();
  
  for (const [scriptName, command] of Object.entries(scripts)) {
    if (!command) continue;
    
    const filePaths = extractFilePaths(command);
    const missing: string[] = [];
    
    for (const candidate of filePaths) {
      const normalized = normalizeAndValidatePath(candidate);
      if (!normalized) continue; // Skip non-local paths
      
      const absolutePath = resolve(repoRoot, normalized);
      if (!existsSync(absolutePath)) {
        missing.push(normalized);
      }
    }
    
    if (missing.length > 0) {
      missingFiles.set(scriptName, missing);
    }
  }
  
  return missingFiles;
}

// 1) Prefix guidance (warning only)
for (const k of keys) {
  if (!prefixRe.test(k) && !isLifecycleHook(k)) {
    warnings.push(
      `Non-standard script prefix: "${k}". ` +
      `Consider aligning with: ${allowedPrefixes.join(', ')}`
    );
  }
}

// 2) Duplicate command detection (error)
const commandToKeys = new Map<string, string[]>();
for (const k of keys) {
  const cmd = (scripts[k] || '').trim();
  const arr = commandToKeys.get(cmd) ?? [];
  arr.push(k);
  commandToKeys.set(cmd, arr);
}
for (const [cmd, ks] of commandToKeys.entries()) {
  if (!cmd) continue;
  if (ks.length > 1) {
    const preferred = ks.find(k => canonicalKeys.has(k)) ?? [...ks].sort((a, b) => a.length - b.length)[0];
    const others = ks.filter(k => k !== preferred);
    errors.push(
      `Duplicate script command detected: ${JSON.stringify(cmd)} is defined under [${ks.join(', ')}]. ` +
      `Prefer a single key: "${preferred}". Remove: ${others.map(o => `"${o}"`).join(', ')}`
    );
  }
}

// 3) Recommend core validate scripts exist (warning)
for (const req of ['validate','validate:dead-code','validate:dead-code:all']) {
  if (!scripts[req]) warnings.push(`Missing recommended script "${req}".`);
}

// 4) Script target existence validation (error)
const missingScriptTargets = validateScriptTargets(scripts);
if (missingScriptTargets.size > 0) {
  for (const [scriptName, paths] of missingScriptTargets.entries()) {
    const missingList = paths.map(path => `  - ${path} (missing)`).join('\n');
    errors.push(`Script "${scriptName}" references missing file(s):\n${missingList}`);
  }
}

if (errors.length) {
  console.error('script-key linter: FAIL');
  for (const e of errors) {
    // Handle multi-line errors (missing file lists)
    if (e.includes('\n')) {
      console.error(' - ' + e.replace(/\n/g, '\n   '));
    } else {
      console.error(' - ' + e);
    }
  }
  if (warnings.length) {
    console.error('\nWarnings:');
    for (const w of warnings) console.error(' - ' + w);
  }
  if (missingScriptTargets.size > 0) {
    console.error('\nFix: update package.json to point at an existing file, or restore/remove the referenced script.');
  }
  process.exit(1);
} else {
  console.log('script-key linter: OK');
  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings) console.log(' - ' + w);
  }
}



