#!/usr/bin/env node
// Fails the run if any test files live outside /tests.
const { execFileSync } = require("node:child_process");

const ROOT = process.cwd();
// Use array of patterns instead of space-delimited string to avoid shell interpolation
const GLOB_PATTERNS = [
  "app/**/__tests__/*.?(c|m)[jt]s?(x)",
  "components/**/__tests__/*.?(c|m)[jt]s?(x)",
  "components/**/*.spec.*",
  "components/**/*.test.*",
  "lib/**/*.spec.*",
  "lib/**/*.test.*",
];

// Use git ls-files to limit to tracked and untracked (cached) files
// Fix: Use execFileSync with argument array to prevent shell escaping of brackets
// The -- separator ensures patterns are treated as pathspecs, not shell globs
let output = '';
try {
  output = execFileSync(
    'git',
    ['ls-files', '-co', '--exclude-standard', '--', ...GLOB_PATTERNS],
    { 
      stdio: ["ignore", "pipe", "ignore"], 
      cwd: ROOT,
      encoding: 'utf8'
    }
  ).trim();
} catch {
  output = '';
}

const files = output.split("\n").filter(Boolean);
if (!files.length) process.exit(0);

console.error("\n❌ Colocated tests detected. Move these files under the `tests/` directory:\n");
for (const f of files) console.error(" -", f);
console.error("\nTip: create mirrors in tests/** and delete the originals.\n");
process.exit(1);


