import fg from "fast-glob";
import kleur from "kleur";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Project, SyntaxKind } from "ts-morph";
import type { Identifier, ImportDeclaration } from "ts-morph";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { z } from "zod";

type BarrelPath =
  | "@/components/ui"
  | "@/components/ui/atoms"
  | "@/components/ui/molecules"
  | "@/components/ui/organisms";

const BARRELS: BarrelPath[] = [
  "@/components/ui",
  "@/components/ui/atoms",
  "@/components/ui/molecules",
  "@/components/ui/organisms",
];

const Args = z.object({
  format: z.enum(["json", "table"]).default("table"),
  out: z.string().optional(),
}).strict();

const rawArgs = yargs(hideBin(process.argv))
  .option("format", { type: "string" })
  .option("out", { type: "string" })
  .parseSync();

// yargs includes extra keys like '_' and '$0' which strict zod schema will reject,
// so pass only the allowed properties to zod.
const argv = Args.parse({ format: (rawArgs as any).format, out: (rawArgs as any).out });

type ExportItem = {
  barrel: BarrelPath;
  exportName: string;
  originModule: string;
  originFile?: string;
};

type Usage = {
  exportName: string;
  barrel: BarrelPath;
  usedAt: { file: string; line: number }[];
  originFile?: string;
  originModule: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const tsconfig = path.resolve(repoRoot, "tsconfig.json");

const project = new Project({
  tsConfigFilePath: tsconfig,
  skipAddingFilesFromTsConfig: false,
});

function resolveBarrelFsPath(barrel: BarrelPath): string {
  // barrels live at components/ui[/sub]/index.ts
  const parts = barrel.replace("@/", "").split("/");
  return path.join(repoRoot, ...parts, "index.ts");
}

function getBarrelFile(fsPath: string) {
  const sf = project.getSourceFile(fsPath);
  if (!sf) throw new Error(`Barrel not found: ${fsPath}`);
  return sf;
}

function scanBarrel(barrel: BarrelPath): ExportItem[] {
  const fsPath = resolveBarrelFsPath(barrel);
  const sf = getBarrelFile(fsPath);
  const items: ExportItem[] = [];
  sf.getExportDeclarations().forEach((ed) => {
    const mod = ed.getModuleSpecifierValue();
    const origin = ed.getModuleSpecifierSourceFile();
    ed.getNamedExports().forEach((ne) => {
      const name = ne.getName();
      const base = { barrel, exportName: name, originModule: mod ?? "" } as ExportItem & {
        originFile?: string;
      };
      if (origin) {
        base.originFile = origin.getFilePath();
      }
      items.push(base);
    });
  });
  return items;
}

function listRepoSources(): string[] {
  return fg.sync(
    [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "pages/**/*.{ts,tsx}",
      "scripts/**/*.{ts,tsx}",
      "docs/**/*.{ts,tsx}",
      "content/**/*.{ts,tsx}",
    ],
    { cwd: repoRoot, absolute: true, dot: false }
  );
}

function collectUsage(items: ExportItem[]): Usage[] {
  const byKey = new Map<string, Usage>();
  items.forEach((it) => {
    const key = `${it.barrel}|${it.exportName}`;
    const base: Usage = {
      exportName: it.exportName,
      barrel: it.barrel,
      usedAt: [],
      originModule: it.originModule,
    } as Usage;
    if (it.originFile) {
      // avoid assigning undefined due to exactOptionalPropertyTypes
      (base as any).originFile = it.originFile;
    }
    byKey.set(key, base);
  });

  const files = listRepoSources();
  files.forEach((p) => project.addSourceFileAtPathIfExists(p));
  project.resolveSourceFileDependencies();

  project.getSourceFiles().forEach((sf) => {
    sf.getImportDeclarations().forEach((imp: ImportDeclaration) => {
      const mod = imp.getModuleSpecifierValue() as BarrelPath;
      if (!BARRELS.includes(mod)) return;
      imp.getNamedImports().forEach((ni) => {
        const imported = ni.getName();
        const key = `${mod}|${imported}`;
        const usage = byKey.get(key);
        if (!usage) return;
        const nameNode = ni.getAliasNode() ?? ni.getNameNode();
        if (nameNode.getKind() !== SyntaxKind.Identifier) return;
        const id = nameNode as Identifier;
        const refs = (id as any).findReferences?.() ?? [];
        refs.forEach((ref: any) => {
          ref.getReferences().forEach((r: any) => {
            const parent = r.getNode().getParent();
            const isInImport =
              r.getNode().getKind() === SyntaxKind.Identifier &&
              (parent?.getKind() === SyntaxKind.ImportSpecifier || parent?.getKind() === SyntaxKind.ImportClause);
            if (isInImport) return;
            const pos = r
              .getNode()
              .getSourceFile()
              .getLineAndColumnAtPos(r.getNode().getStart());
            usage.usedAt.push({ file: sf.getFilePath(), line: pos.line });
          });
        });
      });
    });
  });

  return Array.from(byKey.values());
}

type Group = { originFile?: string; originModule: string; members: Usage[]; allUnused: boolean };
function groupByOrigin(usages: Usage[]) {
  const byOrigin = new Map<string, Group>();
  usages.forEach((u) => {
    const key = `${u.originFile ?? u.originModule}`;
    const base: Group = {
      originModule: u.originModule,
      members: [],
      allUnused: true,
      ...(u.originFile ? { originFile: u.originFile } : {}),
    };
    const entry = byOrigin.get(key) ?? base;
    entry.members.push(u);
    if (u.usedAt.length > 0) entry.allUnused = false;
    byOrigin.set(key, entry);
  });
  return Array.from(byOrigin.values());
}

function printTable(usages: Usage[]) {
  const rows = usages
    .sort((a, b) => a.barrel.localeCompare(b.barrel) || a.exportName.localeCompare(b.exportName))
    .map((u) => {
      const [firstUse] = u.usedAt;
      const used = Boolean(firstUse);
      const first = used && firstUse
        ? `${path.relative(repoRoot, firstUse.file)}:${firstUse.line}`
        : "-";
      return [
        used ? kleur.green("USED ") : kleur.red("UNUSED"),
        u.barrel.padEnd(28),
        u.exportName.padEnd(28),
        (u.originModule ?? "").padEnd(18),
        first,
      ].join("  ");
    });
  console.log(["STATE  BARREL                       EXPORT                      ORIGIN MODULE      FIRST USAGE"].join("  "));
  rows.forEach((r) => console.log(r));
  console.log();
  const groups = groupByOrigin(usages);
  const removable = groups.filter((g) => g.allUnused);
  console.log(kleur.bold().underline(`Removable groups (all members unused): ${removable.length}`));
  removable.forEach((g) => {
    const ofile = g.originFile ? path.relative(repoRoot, g.originFile) : "virtual";
    console.log(`• ${g.originModule}  (${ofile})  →  [${g.members.map((m) => m.exportName).join(", ")}]`);
  });
}

function writeJson(usages: Usage[], outPath: string) {
  const data = {
    generatedAt: new Date().toISOString(),
    usages,
    groups: groupByOrigin(usages),
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(kleur.gray(`Wrote ${path.relative(repoRoot, outPath)}`));
}

function main() {
  const items = BARRELS.flatMap(scanBarrel);
  const usages = collectUsage(items);
  if (argv.format === "table") {
    printTable(usages);
  } else {
    const out = argv.out ?? path.join(repoRoot, "scripts/.cache/ui-usage.json");
    writeJson(usages, out);
  }
}

main();



