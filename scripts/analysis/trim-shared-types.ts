import fs from "node:fs";
import path from "node:path";
import { Project, type ExportDeclaration } from "ts-morph";

/**
 * Trims unused named exports from types/shared/index.ts based on a JSON map,
 * and (optionally) deletes now-unreferenced modules when safe.
 *
 * Usage:
 *   pnpm cleanup:cleanup:cleanup:shared:trim:dry            // dry-run, shows plan
 *   pnpm cleanup:cleanup:shared:trim                // apply edits to index.ts
 *   pnpm cleanup:cleanup:cleanup:shared:trim:prune          // apply edits + delete fully orphaned modules
 */

type UnusedMap = Record<string, string[]>;

const repoRoot = process.cwd();
const tsconfigPath = path.join(repoRoot, "tsconfig.json");
const sharedIndexRel = path.join("types", "shared", "index.ts");
const sharedIndexPath = path.join(repoRoot, sharedIndexRel);
const dataPath = path.join(
  repoRoot,
  "scripts",
  "analysis",
  "data",
  "shared-unused-types.json"
);
const cacheDir = path.join(repoRoot, "scripts", ".cache");
const cacheOut = path.join(cacheDir, "shared-types-trim.json");

// Check for help flag first
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Trim Shared Types Barrel

Trims unused named exports from types/shared/index.ts based on a JSON map,
and (optionally) deletes now-unreferenced modules when safe.

Usage:
  pnpm cleanup:shared:trim [options]

Options:
  --write                   Apply changes to types/shared/index.ts
  --delete                  Delete fully orphaned module files (requires --write)

Examples:
  pnpm cleanup:shared:trim                    # Dry-run: show what would change
  pnpm cleanup:shared:trim --write           # Apply changes to index.ts
  pnpm cleanup:shared:trim --write --delete  # Apply changes + delete orphaned files

Safety:
  - Default mode is dry-run (no changes)
  - --write required to modify files
  - --delete only works with --write
`);
  process.exit(0);
}

const args = new Set(process.argv.slice(2));
const WRITE = args.has("--write");
const DELETE = args.has("--delete");

function assertExists(p: string, hint?: string) {
  if (!fs.existsSync(p)) {
    throw new Error(`Path not found: ${p}${hint ? ` (${hint})` : ""}`);
  }
}

assertExists(sharedIndexPath, "expected shared barrel");
assertExists(dataPath, "expected unused map");

const unused: UnusedMap = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const project = new Project({
  tsConfigFilePath: tsconfigPath,
  skipAddingFilesFromTsConfig: false
});

const indexSf = project.getSourceFile(sharedIndexPath);
if (!indexSf) throw new Error(`Failed to load ${sharedIndexRel}`);

type EditRecord = {
  moduleSpecifier: string;
  removed: string[];
  exportDeclText?: string;
  exportDeclRemoved?: boolean;
  moduleResolvedPath?: string;
  moduleDeleted?: boolean;
  importers?: string[];
};

const edits: EditRecord[] = [];

function normModuleSpecifier(spec: string) {
  // keep as written in the barrel; we'll match by exact string first
  return spec.replace(/\\/g, "/");
}

function getAllImportersOfModule(moduleSpecifier: string): string[] {
  const importers: string[] = [];
  for (const sf of project.getSourceFiles()) {
    if (sf.getFilePath() === sharedIndexPath) continue;
    const imports = sf.getImportDeclarations();
    const reexports = sf.getExportDeclarations();
    for (const d of [...imports, ...reexports]) {
      const spec = d.getModuleSpecifierValue?.() ?? "";
      if (normModuleSpecifier(spec) === moduleSpecifier) {
        importers.push(path.relative(repoRoot, sf.getFilePath()));
      }
    }
  }
  return importers;
}

function removeNamesFromExportDeclaration(
  ed: ExportDeclaration,
  namesToRemove: Set<string>
) {
  const named = ed.getNamedExports();

  // Handle wildcard exports (export type * from 'module')
  if (named.length === 0 && ed.isTypeOnly()) {
    // For wildcard exports, we need to check if all exported names from this module are unused
    // Get the target source file before any modifications
    const targetSf = ed.getModuleSpecifierSourceFile();
    if (targetSf) {
      const exportedNames = Array.from(targetSf.getExportedDeclarations().keys());
      const allUnused = exportedNames.every(name => namesToRemove.has(name));
      if (allUnused) {
        ed.remove();
        return { removedNames: exportedNames, removedDecl: true };
      }
    }
    return { removedNames: [], removedDecl: false };
  }

  // Handle named exports (export { A, B } from 'module')
  const keepers = named.filter((n) => !namesToRemove.has(n.getName()));
  if (keepers.length === 0) {
    ed.remove();
    return { removedNames: named.map((n) => n.getName()), removedDecl: true };
  }
  // Rebuild named exports cleanly
  named.forEach((n) => n.remove());
  for (const k of keepers) {
    ed.addNamedExport(k.getName());
  }
  const removed = named
    .map((n) => n.getName())
    .filter((n) => !keepers.some((k) => k.getName() === n));
  return { removedNames: removed, removedDecl: false };
}

const indexExports = indexSf
  .getExportDeclarations();

// Create a map of export declarations for lookup
const exportMap = new Map<string, ExportDeclaration[]>();
for (const ed of indexExports) {
  const spec = ed.getModuleSpecifierValue();
  if (!spec) continue;
  const s = normModuleSpecifier(spec);
  if (!exportMap.has(s)) {
    exportMap.set(s, []);
  }
  exportMap.get(s)!.push(ed);
}

for (const [modulePathKey, names] of Object.entries(unused)) {
  const namesSet = new Set(names);
  // Find export declarations in the barrel that point at this module
  const hits = exportMap.get(modulePathKey) || [];

  if (hits.length === 0) {
    edits.push({
      moduleSpecifier: modulePathKey,
      removed: []
    });
    continue;
  }

  for (const ed of hits) {
    // Get all info before any modifications
    const before = ed.getText();
    const targetSf = ed.getModuleSpecifierSourceFile();
    const moduleResolvedPath = targetSf
      ? path.relative(repoRoot, targetSf.getFilePath())
      : undefined;

    const { removedNames, removedDecl } =
      removeNamesFromExportDeclaration(ed, namesSet);

    const record: EditRecord = {
      moduleSpecifier: modulePathKey,
      removed: removedNames,
      exportDeclText: before,
      exportDeclRemoved: removedDecl,
      ...(moduleResolvedPath && { moduleResolvedPath })
    };

    // Optionally delete the module if (a) requested, (b) there are zero remaining re-exports from this barrel for that module,
    // and (c) the module has no other importers anywhere in the project.
    if (DELETE && targetSf && !removedDecl) {
      // Check if the export declaration is still valid (not removed)
      try {
        const specValue = ed.getModuleSpecifierValue();
        if (specValue) {
          const stillHasReexports =
            indexSf
              .getExportDeclarations()
              .some(
                (e) =>
                  e !== ed &&
                  e.getModuleSpecifierSourceFile() &&
                  e.getModuleSpecifierSourceFile()!.getFilePath() ===
                    targetSf.getFilePath()
              ) || false;

          const importers = getAllImportersOfModule(
            normModuleSpecifier(specValue)
          );
          record.importers = importers;

          if (!stillHasReexports && importers.length === 0) {
            // Extra safety: only delete if all exported declarations of the module are within the removed set
            const exported = Array.from(targetSf.getExportedDeclarations().keys());
            const allCovered = exported.every((n) => namesSet.has(n));
            if (allCovered) {
              record.moduleDeleted = true;
              if (WRITE) {
                // Remove from project & disk
                targetSf.deleteImmediatelySync();
              }
            }
          }
        }
      } catch {
        // Export declaration was removed, skip deletion logic
      }
    }

    edits.push(record);
  }
}

// Write changes
if (WRITE) {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheOut, JSON.stringify({ edits }, null, 2));
  indexSf.formatText({ indentSize: 2 });
  project.saveSync();
} else {
  // Dry run summary
  console.log(JSON.stringify({ dryRun: true, edits }, null, 2));
}

console.log(
  `${WRITE ? "Applied" : "Planned"}: trimmed ${
    edits.filter((e) => e.removed.length > 0).length
  } export declarations in ${path.relative(repoRoot, sharedIndexPath)}`
);
if (DELETE) {
  const willDelete = edits.filter((e) => e.moduleDeleted);
  console.log(
    `${WRITE ? "Deleted" : "Will delete"} ${willDelete.length} fully orphaned module files`
  );
}

