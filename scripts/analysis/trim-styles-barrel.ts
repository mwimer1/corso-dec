#!/usr/bin/env tsx
/**
 * Trim named exports in styles barrels down to only used (+ allowlisted) names.
 *  - Dry-run by default. Pass --write to persist and create .bak files.
 * Uses scripts/.cache/styles-usage.json (created by scan:styles).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Project } from "ts-morph";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const usagePath = path.join(repoRoot, "scripts/.cache/styles-usage.json");
const allowlistPath = path.join(repoRoot, "scripts/analysis/data/styles-keep-allowlist.json");

// Check for help flag first
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Trim Styles Barrel

Trims named exports in styles barrels down to only used (+ allowlisted) names.
Uses scripts/.cache/styles-usage.json (created by scan:styles).

Usage:
  pnpm cleanup:styles:trim [options]

Options:
  --write                   Apply changes to style barrel files

Examples:
  pnpm cleanup:styles:trim           # Dry-run: show what would change
  pnpm cleanup:styles:trim --write   # Apply changes to barrel files

Safety:
  - Default mode is dry-run (no changes)
  - --write required to modify files
  - Creates .bak backup files before modifying
`);
  process.exit(0);
}

const write = process.argv.includes("--write");

type Usage = {
  barrels: string[];
  usedNames: string[];
  mappingByBarrel: Record<string, { module: string; names: string[] }[]>;
};

function loadJson<T>(p: string): T {
  if (!fs.existsSync(p)) throw new Error(`Missing file: ${path.relative(repoRoot, p)}`);
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

function main() {
  const usage = loadJson<Usage>(usagePath);
  const allowlist = loadJson<Record<string, string[]>>(allowlistPath);
  const used = new Set([
    ...usage.usedNames,
    ...((allowlist["global"]) ?? []),
    ...((allowlist["atoms"]) ?? []),
    ...((allowlist["molecules"]) ?? []),
    ...((allowlist["organisms"]) ?? []),
  ]);

  const project = new Project({ tsConfigFilePath: path.join(repoRoot, "tsconfig.json") });
  const changed: Array<{ barrel: string; removed: Record<string, string[]> }> = [];

  for (const rel of usage.barrels) {
    const barrelPath = path.join(repoRoot, rel);
    const sf = project.getSourceFile(barrelPath);
    if (!sf) continue;

    const before = sf.getFullText();
    const removedByModule: Record<string, string[]> = {};

    for (const ed of sf.getExportDeclarations()) {
      const mod = ed.getModuleSpecifierValue() ?? "";
      const named = ed.getNamedExports();
      if (named.length === 0) {
        // export * from './x' — leave intact for now.
        continue;
      }
      const names = named.map((ne) => ne.getName());
      const keep = names.filter((name) => used.has(name));
      const remove = names.filter((n) => !used.has(n));

      if (remove.length) removedByModule[mod] = remove;

      if (keep.length === 0) {
        ed.remove();
      } else if (keep.length !== names.length) {
        // Rebuild the export declaration with the kept names, preserving type-only status
        const modText = mod ? ` from "${mod}"` : "";
        const isTypeOnly = (typeof (ed as any).isTypeOnly === "function") ? (ed as any).isTypeOnly() : false;
        const newDecl = `export ${isTypeOnly ? "type " : ""}{ ${keep.join(", ")} }${modText};`;
        ed.replaceWithText(newDecl);
      }
    }

    const afterText = sf.getFullText();
    if (before !== afterText) {
      changed.push({ barrel: rel, removed: removedByModule });
      if (write) {
        const bak = barrelPath + ".bak";
        fs.writeFileSync(bak, before, "utf8");
      }
    }
  }

  if (changed.length === 0) {
    console.log("No changes (nothing to trim).");
  } else {
    for (const c of changed) {
      console.log(`Trimmed ${c.barrel}`);
      for (const [mod, names] of Object.entries(c.removed)) {
        if (names.length === 0) continue;
        console.log("  -", mod, "→ removed", names.length, "names");
      }
    }
    if (write) {
      project.saveSync();
      console.log("Saved changes. Backups written as *.bak next to each barrel.");
    } else {
      console.log("Dry-run only. Re-run with --write to persist.");
    }
  }
}

main();



