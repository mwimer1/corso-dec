#!/usr/bin/env tsx
// scripts/maintenance/generate-alias-doc.ts

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const START = "<!-- BEGIN:alias-table (auto-generated) -->";
const END   = "<!-- END:alias-table -->";

function posixify(p: string) {
  return p.replace(/\\/g, "/");
}

/** Load and fully parse tsconfig (handles `extends`, JSONC, etc.). */
function loadPaths(): Record<string, string[]> {
  const tsconfigPath = resolve(process.cwd(), "config/typescript/tsconfig.base.json");
  const host: ts.ParseConfigFileHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    getCurrentDirectory: () => process.cwd(),
    onUnRecoverableConfigFileDiagnostic(diag) {
      const msg = ts.flattenDiagnosticMessageText(diag.messageText, "\n");
      throw new Error(`tsconfig error: ${msg}`);
    },
  };

  const parsed = ts.getParsedCommandLineOfConfigFile(tsconfigPath, {}, host);
  if (!parsed) throw new Error("Failed to parse tsconfig.");
  const rawPaths = parsed.options.paths ?? {};

  // Normalize to posix and ensure arrays
  const normalized: Record<string, string[]> = {};
  for (const [alias, targets] of Object.entries(rawPaths)) {
    normalized[posixify(alias)] = (targets ?? []).map((t) => posixify(t));
  }
  return normalized;
}

/** Render a deterministic bullet list for the README block. */
function toTable(paths: Record<string, string[]>) {
  const entries = Object.entries(paths)
    .map(([alias, targets]) => ({
      alias,
      targets: targets?.length ? targets : [""],
    }))
    .sort((a, b) => a.alias.localeCompare(b.alias));

  const lines: string[] = ["- **Foundational:**"];
  for (const { alias, targets } of entries) {
    const rhs = targets.map((t) => `\`${t.replace(/^\.\//, "")}\``).join(", ");
    lines.push(`  - \`${alias}\` → ${rhs}`);
  }
  return lines.join("\n");
}

function extractCurrentBlock(src: string) {
  const startIdx = src.indexOf(START);
  const endIdx = src.indexOf(END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;
  const inner = src.slice(startIdx + START.length, endIdx).trim();
  return { startIdx, endIdx, inner };
}

function updateReadmeBlock(readmePath: string, content: string, { check = false } = {}) {
  const src = readFileSync(readmePath, "utf8");
  const block = extractCurrentBlock(src);
  if (!block) {
    console.error("Alias block markers not found in README.md");
    process.exit(2);
  }
  const next =
    src.slice(0, block.startIdx + START.length) + "\n" + content + "\n" + src.slice(block.endIdx);

  if (check) {
    if (src === next) {
      console.log("Alias table up to date.");
      return;
    }
    console.error("Alias table is out of date. Run: pnpm docs:aliases");
    process.exit(3);
  } else {
    if (src === next) {
      console.log("Alias table already up to date.");
      return;
    }
    writeFileSync(readmePath, next);
    console.log("Alias table updated.");
  }
}

function main() {
  const check = process.argv.includes("--check");
  const paths = loadPaths();
  const table = toTable(paths);
  const readme = resolve(process.cwd(), "README.md");
  updateReadmeBlock(readme, table, { check });
}

main();



