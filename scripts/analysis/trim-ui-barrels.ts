import kleur from "kleur";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createProject, loadJson, trimBarrelExports, type TrimOptions } from "../utils/barrel-trim";

type BarrelPath =
  | "@/components/ui"
  | "@/components/ui/atoms"
  | "@/components/ui/molecules"
  | "@/components/ui/organisms";

const BARREL_TO_FS: Record<BarrelPath, string> = {
  "@/components/ui": "components/ui/index.ts",
  "@/components/ui/atoms": "components/ui/atoms/index.ts",
  "@/components/ui/molecules": "components/ui/molecules/index.ts",
  "@/components/ui/organisms": "components/ui/organisms/index.ts",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const tsconfig = path.resolve(repoRoot, "tsconfig.json");
const usageJson = path.resolve(repoRoot, "scripts/.cache/ui-usage.json");
const keepJson = path.resolve(repoRoot, "scripts/analysis/data/ui-keep-allowlist.json");

const argv = yargs(hideBin(process.argv))
  .option("write", { 
    type: "boolean", 
    default: false,
    desc: "Apply changes to UI barrel files"
  })
  .option("dry-run", { 
    type: "boolean", 
    default: false,
    desc: "Show what would change without applying (default behavior)"
  })
  .option("delete", {
    type: "boolean",
    default: false,
    desc: "Delete origin files whose entire group is unused and fully trimmed (requires --write)",
  })
  .help()
  .alias('help', 'h')
  .usage(`
Trim UI Barrels

Trims unused exports from UI component barrel files.
Uses scripts/.cache/ui-usage.json (created by scan:ui:json).

Usage:
  pnpm cleanup:ui:trim [options]

Examples:
  pnpm cleanup:ui:trim                    # Dry-run: show what would change
  pnpm cleanup:ui:trim --write             # Apply changes to barrel files
  pnpm cleanup:ui:trim --write --delete    # Apply changes + delete unused files

Safety:
  - Default mode is dry-run (no changes)
  - --write required to modify files
  - --delete only works with --write
`)
  .parseSync();

type Usage = {
  exportName: string;
  barrel: BarrelPath;
  usedAt: { file: string; line: number }[];
  originFile?: string;
  originModule: string;
};

// Using shared utilities from barrel-trim.ts

function deleteIfSafe(file: string) {
  if (!file) return false;
  if (!fs.existsSync(file)) return false;
  fs.rmSync(file, { force: true });
  console.log(kleur.gray(`deleted ${path.relative(repoRoot, file)}`));
  return true;
}

function main() {
  try {
    const { usages, groups } = loadJson<{ usages: Usage[]; groups: any[] }>(usageJson, repoRoot);
    const keep = loadJson<{ byBarrel: Record<string, string[]>; byOriginFile: string[] }>(keepJson, repoRoot);

    const removalsByBarrel = new Map<BarrelPath, Set<string>>();
    (Object.keys(BARREL_TO_FS) as BarrelPath[]).forEach((b) => removalsByBarrel.set(b, new Set<string>()));

    usages.forEach((u) => {
      const keepThis =
        (keep.byBarrel?.[u.barrel]?.includes(u.exportName) ?? false) ||
        (u.originFile
          ? Boolean(
              keep.byOriginFile?.some((p) => {
                try {
                  const candidate = path.isAbsolute(p) ? path.normalize(p) : path.normalize(path.resolve(repoRoot, p));
                  return candidate === path.normalize(u.originFile!);
                } catch {
                  return false;
                }
              })
            )
          : false);
      if (u.usedAt.length === 0 && !keepThis) {
        removalsByBarrel.get(u.barrel)!.add(u.exportName);
      }
    });

    const project = createProject(tsconfig);
    const trimOptions: TrimOptions = {
      write: argv.write ?? false,
      dryRun: argv["dry-run"] ?? false,
      backup: true,
    };

    let anyChanges = false;
    for (const [barrel, names] of removalsByBarrel.entries()) {
      if (names.size === 0) continue;
      const file = path.resolve(repoRoot, BARREL_TO_FS[barrel]);
      const mode = argv.write && !argv["dry-run"] ? "TRIM" : "DRY";
      console.log(kleur.bold(`${mode} ${barrel} → removing ${names.size} exports`));
      if (!argv.write || argv["dry-run"]) {
        names.forEach((n) => console.log(`  - ${n}`));
        continue;
      }
      const result = trimBarrelExports(project, file, names, trimOptions);
      anyChanges = anyChanges || result.changed;
    }

    if (argv.write && argv.delete) {
      const removableGroups = groups.filter((g: any) => g.allUnused && g.originFile);
      removableGroups.forEach((g: any) => deleteIfSafe(g.originFile));
    }

    if (!argv.write || argv["dry-run"]) {
      console.log(kleur.gray("No files were changed. Re-run with --write to persist changes."));
    } else if (!anyChanges) {
      console.log(kleur.gray("No barrel changes were necessary (nothing to remove or already trimmed)."));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(kleur.red(`Error: ${message}`));
    if (message.includes('Missing file')) {
      console.error(kleur.red(`Run: pnpm scan:ui:json`));
    }
    process.exit(1);
  }
}

main();



