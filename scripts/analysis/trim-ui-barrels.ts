import kleur from "kleur";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Project } from "ts-morph";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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
  .option("write", { type: "boolean", default: false })
  .option("dry-run", { type: "boolean", default: false })
  .option("delete", {
    type: "boolean",
    default: false,
    desc: "Delete origin files whose entire group is unused and fully trimmed.",
  })
  .parseSync();

type Usage = {
  exportName: string;
  barrel: BarrelPath;
  usedAt: { file: string; line: number }[];
  originFile?: string;
  originModule: string;
};

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function backup(p: string) {
  const bak = `${p}.bak`;
  fs.copyFileSync(p, bak);
  return bak;
}

function trimBarrel(project: Project, fsPath: string, removals: Set<string>) {
  const sf = project.getSourceFileOrThrow(fsPath);
  let changed = false;
  sf.getExportDeclarations().forEach((ed) => {
    const named = ed.getNamedExports();
    const keep = named.filter((ne) => !removals.has(ne.getName()));
    if (keep.length !== named.length) {
      changed = true;
      // remove all current then re-add the kept ones
      named.forEach((ne) => ne.remove());
      keep.forEach((k) => ed.addNamedExport(k.getName()));
    }
  });
  if (changed) sf.saveSync();
  return changed;
}

function deleteIfSafe(file: string) {
  if (!file) return false;
  if (!fs.existsSync(file)) return false;
  fs.rmSync(file, { force: true });
  console.log(kleur.gray(`deleted ${path.relative(repoRoot, file)}`));
  return true;
}

function main() {
  if (!fs.existsSync(usageJson)) {
    console.error(kleur.red(`Missing ${path.relative(repoRoot, usageJson)}. Run: pnpm scan:ui:json`));
    process.exit(1);
  }
  const { usages, groups } = readJson<{ usages: Usage[]; groups: any[] }>(usageJson);
  const keep = readJson<{ byBarrel: Record<string, string[]>; byOriginFile: string[] }>(keepJson);

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

  const project = new Project({ tsConfigFilePath: tsconfig, skipAddingFilesFromTsConfig: false });

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
    backup(file);
    const changed = trimBarrel(project, file, names);
    anyChanges = anyChanges || changed;
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
}

main();



