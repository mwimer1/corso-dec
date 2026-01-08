#!/usr/bin/env node
// Fails the run if any test files live outside /tests.
const { execSync } = require("node:child_process");

const ROOT = process.cwd();
const GLOB = [
  "app/**/__tests__/*.?(c|m)[jt]s?(x)",
  "components/**/__tests__/*.?(c|m)[jt]s?(x)",
  "components/**/*.spec.*",
  "components/**/*.test.*",
  "lib/**/*.spec.*",
  "lib/**/*.test.*",
].join(" ");

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], cwd: ROOT })
    .toString()
    .trim();
}

// Use git ls-files to limit to tracked and untracked (cached) files
let output = '';
try {
  output = sh(`git ls-files -co --exclude-standard -- ${GLOB}`);
} catch {
  output = '';
}

const files = output.split("\n").filter(Boolean);
if (!files.length) process.exit(0);

console.error("\n❌ Colocated tests detected. Move these files under the `tests/` directory:\n");
for (const f of files) console.error(" -", f);
console.error("\nTip: create mirrors in tests/** and delete the originals.\n");
process.exit(1);


