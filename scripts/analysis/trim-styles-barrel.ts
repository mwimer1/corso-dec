#!/usr/bin/env tsx
/**
 * Trim named exports in styles barrels down to only used (+ allowlisted) names.
 *  - Dry-run by default. Pass --write to persist and create .bak files.
 * Uses scripts/.cache/styles-usage.json (created by scan:styles).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createProject, loadJson, trimBarrelExportsByModule, type TrimOptions } from "../utils/barrel-trim";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const usagePath = path.join(repoRoot, "scripts/.cache/styles-usage.json");
const allowlistPath = path.join(repoRoot, "scripts/analysis/styles-keep-allowlist.json");

const argv = yargs(hideBin(process.argv))
  .scriptName('trim-styles-barrel')
  .usage('Trim Styles Barrel\n\nTrims named exports in styles barrels down to only used (+ allowlisted) names.\nUses scripts/.cache/styles-usage.json (created by scan:styles).')
  .option('write', {
    type: 'boolean',
    default: false,
    description: 'Apply changes to style barrel files',
  })
  .help()
  .alias('help', 'h')
  .example('$0', 'Dry-run: show what would change')
  .example('$0 --write', 'Apply changes to barrel files')
  .epilogue('Safety:\n  - Default mode is dry-run (no changes)\n  - --write required to modify files\n  - Creates .bak backup files before modifying')
  .parseSync();

const write = argv.write;

type Usage = {
  barrels: string[];
  usedNames: string[];
  mappingByBarrel: Record<string, { module: string; names: string[] }[]>;
};

function main() {
  const usage = loadJson<Usage>(usagePath, repoRoot);
  const allowlist = loadJson<Record<string, string[]>>(allowlistPath, repoRoot);
  const used = new Set([
    ...usage.usedNames,
    ...((allowlist["global"]) ?? []),
    ...((allowlist["atoms"]) ?? []),
    ...((allowlist["molecules"]) ?? []),
    ...((allowlist["organisms"]) ?? []),
  ]);

  const project = createProject(path.join(repoRoot, "tsconfig.json"));
  const trimOptions: TrimOptions = {
    write,
    dryRun: !write,
    backup: true,
  };
  const changed: Array<{ barrel: string; removed: Record<string, string[]> }> = [];

  for (const rel of usage.barrels) {
    const barrelPath = path.join(repoRoot, rel);
    
    // Build removals map by module
    const removalsByModule = new Map<string, Set<string>>();
    const sf = project.getSourceFile(barrelPath);
    if (!sf) continue;

    // Collect removals by module
    for (const ed of sf.getExportDeclarations()) {
      const mod = ed.getModuleSpecifierValue() ?? "";
      const named = ed.getNamedExports();
      if (named.length === 0) {
        // export * from './x' — leave intact for now.
        continue;
      }
      const names = named.map((ne) => ne.getName());
      const remove = names.filter((n) => !used.has(n));

      if (remove.length > 0) {
        removalsByModule.set(mod, new Set(remove));
      }
    }

    if (removalsByModule.size === 0) continue;

    // Use shared utility to trim
    const result = trimBarrelExportsByModule(project, barrelPath, removalsByModule, trimOptions);

    if (result.changed) {
      const removedByModule: Record<string, string[]> = {};
      removalsByModule.forEach((names, mod) => {
        removedByModule[mod] = Array.from(names);
      });
      changed.push({ barrel: rel, removed: removedByModule });
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
      console.log("Saved changes. Backups written as *.bak next to each barrel.");
    } else {
      console.log("Dry-run only. Re-run with --write to persist.");
    }
  }
}

main();



