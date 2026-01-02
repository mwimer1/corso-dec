#!/usr/bin/env tsx
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const CWD = process.cwd();
const EXCLUDE_DIRS = new Set([
  "node_modules",".next","dist",".turbo",".git","coverage","storybook-static",".typegen","scripts"
]);
const EXTS = new Set([".ts",".tsx",".mts",".cts",".js",".jsx",".mjs",".cjs"]);
const BAD = "/security/rate-limiting/guards";
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

let offenders: string[] = [];

function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { walk(full); continue; }
    if (!EXTS.has(extname(full))) continue;
    const src = readFileSync(full, "utf8");
    let matched = false;
    for (const re of SPECIFIER_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(src)) { matched = true; break; }
    }
    if (!matched) continue;
    const rel = full.replace(CWD + "/", "").replace(/\\\\/g, "/");
    if (ALLOW_FILES.has(rel)) continue;
    offenders.push(rel);
  }
}
walk(CWD);

if (offenders.length) {
  console.error("Deprecated imports detected (use '@/lib/security/rate-limiting' instead):");
  for (const f of offenders) console.error(" - " + f);
  process.exitCode = 1;
} else {
  console.log("OK: no deprecated rate-limiting imports found.");
}


