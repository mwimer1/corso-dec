#!/usr/bin/env tsx
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { getRepoRoot, getRelativePath, normalizePath, createLintResult } from './_utils';
import { COMMON_IGNORE_PATTERNS } from '../utils/constants';

const EXCLUDE_DIRS = new Set([
  ...COMMON_IGNORE_PATTERNS,
  ".typegen", "scripts"
]);
const EXTS = new Set([".ts",".tsx",".mts",".cts",".js",".jsx",".mjs",".cjs"]);
const ALLOW_FILES = new Set([
  "lib/security/rate-limiting/guards.ts"
]);

// Patterns that capture only actual module specifiers in import/export/require/dynamic import
const SPECIFIER_PATTERNS: RegExp[] = [
  /from\s+['"`]([^'"`]*\/security\/rate-limiting\/guards(?:\.ts)?)['"`]/g,
  /import\(\s*['"`]([^'"`]*\/security\/rate-limiting\/guards(?:\.ts)?)['"`]\s*\)/g,
  /require\(\s*['"`]([^'"`]*\/security\/rate-limiting\/guards(?:\.ts)?)['"`]\s*\)/g,
  /export\s+\*?\s*from\s+['"`]([^'"`]*\/security\/rate-limiting\/guards(?:\.ts)?)['"`]/g,
  /import\s+['"`]([^'"`]*\/security\/rate-limiting\/guards(?:\.ts)?)['"`]/g,
];

function walk(dir: string, offenders: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { 
      walk(full, offenders); 
      continue; 
    }
    if (!EXTS.has(extname(full))) continue;
    const src = readFileSync(full, "utf8");
    let matched = false;
    for (const re of SPECIFIER_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(src)) { matched = true; break; }
    }
    if (!matched) continue;
    const rel = normalizePath(getRelativePath(full));
    if (ALLOW_FILES.has(rel)) continue;
    offenders.push(rel);
  }
  return offenders;
}

function main() {
  const result = createLintResult();
  const offenders = walk(getRepoRoot());
  
  if (offenders.length) {
    for (const f of offenders) {
      result.addError(f);
    }
  }

  // Preserve original output format
  if (result.hasErrors()) {
    console.error("Deprecated imports detected (use '@/lib/security/rate-limiting' instead):");
    for (const error of result.getErrors()) {
      console.error(" - " + error);
    }
    process.exitCode = 1;
  } else {
    console.log("OK: no deprecated rate-limiting imports found.");
  }
}

main();


