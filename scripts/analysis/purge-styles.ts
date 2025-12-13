#!/usr/bin/env tsx
/**
 * Purge now-unreferenced style source files after trimming barrels.
 * Strategy:
 *  - Compare *.bak vs current barrels to find module specifiers removed entirely
 *  - Resolve to source file paths and delete if no direct imports of that path exist
 *
 * Dry-run by default. Pass --write to delete files.
 */
import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Project } from "ts-morph";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

// Check for help flag first
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Purge Unused Styles

Purges now-unreferenced style source files after trimming barrels.
Strategy:
- Compare *.bak vs current barrels to find module specifiers removed entirely
- Resolve to source file paths and delete if no direct imports exist

Usage:
  pnpm cleanup:styles:purge [options]

Options:
  --write                   Delete unused style files

Examples:
  pnpm cleanup:styles:purge           # Dry-run: show what would be deleted
  pnpm cleanup:styles:purge --write    # Delete unused style files

Safety:
  - Default mode is dry-run (no deletions)
  - --write required to delete files
  - Only deletes files that are fully unreferenced
`);
  process.exit(0);
}

const write = process.argv.includes("--write");

const TARGET_BARRELS = [
  "styles/ui/atoms/index.ts",
  "styles/ui/molecules/index.ts",
  "styles/ui/organisms/index.ts",
];

function toAbs(rel: string) {
  return path.join(repoRoot, rel);
}

function resolveModuleToFile(barrelAbs: string, moduleSpecifier: string) {
  const baseDir = path.dirname(barrelAbs);
  const tryPaths = [
    path.join(baseDir, moduleSpecifier + ".ts"),
    path.join(baseDir, moduleSpecifier + ".tsx"),
    path.join(baseDir, moduleSpecifier, "index.ts"),
  ];
  for (const p of tryPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function anyDirectImports(moduleRelFromStylesUi: string) {
  const importNeedle = `@/styles/ui/${moduleRelFromStylesUi.replace(/^\.\\\//, "")}`;
  const files = fg.sync(["{app,components,lib,hooks,actions,contexts,tools,scripts}/**/*.{ts,tsx}"], {
    cwd: repoRoot,
    dot: false,
    ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/build/**"],
  });
  for (const rel of files) {
    const abs = path.join(repoRoot, rel);
    const txt = fs.readFileSync(abs, "utf8");
    if (txt.includes(`"${importNeedle}"`) || txt.includes(`'${importNeedle}'`)) return true;
  }
  return false;
}

function main() {
  const project = new Project({ tsConfigFilePath: path.join(repoRoot, "tsconfig.json") });
  void project; // project available if we later need AST reads

  const removals: string[] = [];

  for (const barrelRel of TARGET_BARRELS) {
    const barrelAbs = toAbs(barrelRel);
    const bak = barrelAbs + ".bak";
    if (!fs.existsSync(bak) || !fs.existsSync(barrelAbs)) continue;
    const before = fs.readFileSync(bak, "utf8");
    const after = fs.readFileSync(barrelAbs, "utf8");

    const modRe = /export\s+\{[^}]*\}\s+from\s+["']([^"']+)["']/g;
    const beforeMods = new Set<string>();
    const afterMods = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = modRe.exec(before))) {
      const spec = m[1];
      if (typeof spec === "string") beforeMods.add(spec);
    }
    while ((m = modRe.exec(after))) {
      const spec = m[1];
      if (typeof spec === "string") afterMods.add(spec);
    }

    for (const mod of beforeMods) {
      if (afterMods.has(mod)) continue;
      const fileAbs = resolveModuleToFile(barrelAbs, mod);
      if (!fileAbs) continue;
      const relFromStylesUi = path.relative(path.join(repoRoot, "styles/ui"), fileAbs).replace(/\\/g, "/");
      if (anyDirectImports(relFromStylesUi)) continue; // still used directly
      removals.push(fileAbs);
    }
  }

  if (removals.length === 0) {
    console.log("No style source files eligible for purge.");
    return;
  }

  console.log("Style files eligible for purge:", removals.length);
  removals.forEach((p) => console.log("  -", path.relative(repoRoot, p)));

  if (!write) {
    console.log("Dry-run only. Re-run with --write to delete.");
    return;
  }

  for (const abs of removals) {
    try {
      fs.rmSync(abs, { force: true });
      const dts = abs.replace(/\.tsx?$/, ".d.ts");
      if (fs.existsSync(dts)) fs.rmSync(dts, { force: true });
    } catch (err) {
      console.warn("Failed to delete:", abs, err);
    }
  }
  console.log("Deleted", removals.length, "files.");
}

main();



