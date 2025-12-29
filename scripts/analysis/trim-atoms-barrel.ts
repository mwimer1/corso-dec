/**
 * Trim named exports from atoms barrels.
 *
 * Sources of truth (in priority order):
 *   1) --names=a,b,c (comma-separated explicit list)
 *   2) --preset=batch01 (predefined list below)
 *   3) Fallback to usage report `unused` (first N via --limit=15)
 *
 * Examples:
 *   pnpm cleanup:cleanup:atoms:trim --target=styles --preset=batch01
 *   pnpm cleanup:cleanup:cleanup:atoms:trim:components --limit=20
 *   pnpm cleanup:cleanup:atoms:trim --target=components --names=Button,Card
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Node, Project, SyntaxKind } from "ts-morph";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createProject, removeExportModifier } from "../utils/barrel-trim";

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, "..", "..");

const argv = yargs(hideBin(process.argv))
  .scriptName('trim-atoms-barrel')
  .usage('Trim named exports from atoms barrels.\n\nSources of truth (in priority order):\n  1) --names=a,b,c (comma-separated explicit list)\n  2) --preset=batch01 (predefined list)\n  3) Fallback to usage report `unused` (first N via --limit=15)')
  .option('target', {
    type: 'string',
    choices: ['styles', 'components', 'organisms'],
    default: 'styles',
    description: 'Target barrel type',
  })
  .option('mode', {
    type: 'string',
    choices: ['barrel', 'declaration'],
    default: 'barrel',
    description: 'Trim mode',
  })
  .option('delete', {
    type: 'boolean',
    default: false,
    description: 'Delete nodes (not just remove export modifier)',
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    description: 'Dry-run mode (show what would change)',
  })
  .option('limit', {
    type: 'number',
    default: 15,
    description: 'Limit number of items to trim from unused list',
  })
  .option('names', {
    type: 'string',
    description: 'Comma-separated list of explicit names to trim',
  })
  .option('preset', {
    type: 'string',
    description: 'Preset name (e.g., batch01)',
  })
  .help()
  .alias('help', 'h')
  .example('$0 --target=styles --preset=batch01', 'Use preset list')
  .example('$0 --target=components --limit=20', 'Trim first 20 unused')
  .example('$0 --target=components --names=Button,Card', 'Trim specific names')
  .parseSync();

const TARGET = (argv.target ?? 'styles') as "styles" | "components" | "organisms";
const MODE = (argv.mode ?? 'barrel') as "barrel" | "declaration";
const DELETE_NODE = argv.delete ?? false;
const DRY_RUN = argv['dry-run'] ?? false;
const CFG = {
  styles: {
    spec: "@/styles/ui/atoms",
    barrel: resolve(ROOT, "styles", "ui", "atoms", "index.ts"),
    report: resolve(ROOT, "scripts", ".cache", "atoms-styles-usage.json"),
  },
  components: {
    spec: "@/components/ui/atoms",
    barrel: resolve(ROOT, "components", "ui", "atoms", "index.ts"),
    report: resolve(ROOT, "scripts", ".cache", "atoms-components-usage.json"),
  },
  organisms: {
    spec: "@/styles/ui/organisms",
    barrel: resolve(ROOT, "styles", "ui", "organisms", "index.ts"),
    report: resolve(ROOT, "scripts", ".cache", "organisms-styles-usage.json"),
  },
}[TARGET];

const PRESETS: Record<string, string[]> = {
  // Batch 01: targeted 15 names from user's unused list
  batch01: [
    "animatedPill",
    "AnimatedPillVariants",
    "badgeVariants",
    "BadgeVariantProps",
    "cardVariants",
    "CardVariantProps",
    "checkboxVariants",
    "CheckboxVariantProps",
    "datePickerInputVariants",
    "DatePickerInputVariantProps",
    "inputVariants",
    "InputVariantProps",
    "linkVariants",
    "LinkVariantProps",
  ],
  // Organisms — focus on PieChart variants first (safe, previously removed analyzers)
  "organisms-pie-batch01": [
    "PieChartVariantProps",
    "PieChartContainerVariantProps",
    "PieChartSliceVariantProps",
    "PieChartLabelVariantProps",
    "PieChartLegendVariantProps",
    "PieChartTooltipVariantProps",
    "pieChartVariants",
    "pieChartContainerVariants",
    "pieChartSliceVariants",
    "pieChartLabelVariants",
    "pieChartLegendVariants",
    "pieChartTooltipVariants",
  ],
  // (Optional) Add component presets later, e.g.:
  // "components-batch01": ["Logo", "LogoDog", ...]
};

function getLimit(): number {
  const limit = argv.limit;
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 15;
}

function getExplicitNames(): string[] | null {
  if (!argv.names) return null;
  return argv.names.split(",").map(s => s.trim()).filter(Boolean);
}

function getPresetNames(): string[] | null {
  if (!argv.preset) return null;
  return PRESETS[argv.preset] ?? null;
}

function ensureReport() {
  if (!existsSync(CFG.report)) {

    console.log(`No usage report found for '${TARGET}'; generating…`);
    const flag = `--target=${TARGET}`;
    execSync(`tsx scripts/analysis/scan-atoms-usage.ts ${flag}`, { stdio: "inherit" });
  }
}

// removeExportModifier is now imported from barrel-trim.ts

function deleteDeclaration(node: Node): boolean {
  if (Node.isVariableStatement(node)) { if (!DRY_RUN) node.remove(); return true; }
  if (Node.isFunctionDeclaration(node)) { if (!DRY_RUN) node.remove(); return true; }
  if (Node.isClassDeclaration(node)) { if (!DRY_RUN) node.remove(); return true; }
  if (Node.isInterfaceDeclaration(node)) { if (!DRY_RUN) node.remove(); return true; }
  if (Node.isTypeAliasDeclaration(node)) { if (!DRY_RUN) node.remove(); return true; }
  if (Node.isEnumDeclaration(node)) { if (!DRY_RUN) node.remove(); return true; }
  return false;
}

function isImportedAnywhere(project: Project, name: string): boolean {
  for (const sf of project.getSourceFiles()) {
    const fp = sf.getFilePath();
    if (fp.includes(`${sep}node_modules${sep}`) || fp.includes(`${sep}.next${sep}`) || fp.includes(`${sep}.turbo${sep}`)) continue;
    // Skip documentation and script files
    if (fp.endsWith('.md') || fp.endsWith('.mdx') || fp.includes(`${sep}scripts${sep}`) || fp.includes(`${sep}tools${sep}`)) continue;
    // Only check actual source code directories
    if (!fp.includes(`${sep}components${sep}`) && !fp.includes(`${sep}app${sep}`) && !fp.includes(`${sep}lib${sep}`) && !fp.includes(`${sep}hooks${sep}`)) continue;

    for (const imp of sf.getImportDeclarations()) {
      for (const ni of imp.getNamedImports()) {
        if (ni.getName() === name) return true; // import { name } from '…'
      }
    }
    for (const ed of sf.getExportDeclarations()) {
      for (const ne of ed.getNamedExports()) {
        if (ne.getName() === name) return true; // re-export elsewhere
      }
    }
  }
  return false;
}

function handleOrganismsExportStar(toRemove: Set<string>) {
  const barrel = CFG.barrel;
  const project = createProject(resolve(ROOT, "tsconfig.json"));

  const barrelFile = project.getSourceFile(barrel);
  if (!barrelFile) {

    console.error(`❌ Could not find organisms barrel at: ${barrel}`);
    process.exit(2);
  }

  // Find all export * statements in the barrel
  const exportStars = barrelFile.getDescendantsOfKind(SyntaxKind.ExportDeclaration)
    .filter(ed => ed.getText().includes('export *'));

  const removed: string[] = [];
  const notFound: string[] = [];

  for (const exportStar of exportStars) {
    const moduleSpecifier = exportStar.getModuleSpecifierValue();
    if (!moduleSpecifier) continue;

    // Resolve the source file path
    const sourceFilePath = resolve(barrelFile.getDirectoryPath(), moduleSpecifier + '.ts');
    const sourceFile = project.getSourceFile(sourceFilePath);

    if (!sourceFile) {

      console.warn(`⚠️ Could not find source file: ${sourceFilePath}`);
      continue;
    }

    // Get all exports from the source file
    const exportMap = sourceFile.getExportedDeclarations();
    const exportedNames = Array.from(exportMap.keys());

    // Find which of our target exports are in this source file
    for (const targetName of toRemove) {
      if (exportedNames.includes(targetName)) {
        const decls = exportMap.get(targetName);
        if (decls && decls.length > 0) {
          // Check if the export is used anywhere
          if (!isImportedAnywhere(project, targetName)) {
            // For organisms, we need to handle both individual exports and grouped exports
            const allRemoved = removeFromExportDeclarations(sourceFile, targetName, project);
            if (allRemoved) {
              removed.push(targetName);
            } else {
              notFound.push(targetName);
            }
          }
        } else {
          notFound.push(targetName);
        }
      }
    }
  }

  if (!DRY_RUN) {
    project.saveSync();
  } else {

    console.log("DRY RUN: no files written.");
  }


  console.log(`✅ Organisms exports trimmed (export * mode).`);
  if (removed.length) {

    console.log(`Removed: ${removed.join(', ')}`);
  }
  if (notFound.length) {

    console.log(`Not found in source files: ${notFound.join(', ')}`);
  }
}

function removeFromExportDeclarations(sourceFile: any, targetName: string, project: Project): boolean {
  // First, try to remove individual export declarations
  const individualExports = sourceFile.getDescendantsOfKind(SyntaxKind.ExportDeclaration)
    .filter((ed: any) => !ed.getText().includes('export *'));

  for (const exportDecl of individualExports) {
    const namedExports = exportDecl.getNamedExports();
    const exportSpecifier = namedExports.find((ne: any) => ne.getName() === targetName);

    if (exportSpecifier) {
      if (namedExports.length === 1) {
        // If this is the only export in the declaration, remove the entire declaration
        if (!DRY_RUN) exportDecl.remove();
        return true;
      } else {
        // Remove just this export from the declaration
        if (!DRY_RUN) exportSpecifier.remove();
        return true;
      }
    }
  }

  // If not found in individual exports, it might be in a variable declaration that's exported
  const varDecls = sourceFile.getVariableDeclarations();
  for (const varDecl of varDecls) {
    if (varDecl.isExported() && varDecl.getName() === targetName) {
      if (!DRY_RUN) varDecl.setIsExported(false);
      return true;
    }
  }

  return false;
}

function main() {
  // Determine target names
  const explicit = getExplicitNames();
  const preset = getPresetNames();
  let targets: string[] = [];
  if (explicit && explicit.length > 0) {
    targets = explicit;

    console.log("Using explicit trim list:", targets.join(", "));
  } else if (preset && preset.length > 0) {
    targets = preset;

    console.log("Using preset trim list:", targets.join(", "));
  } else {
    ensureReport();
    const data = JSON.parse(readFileSync(CFG.report, "utf8"));
    const unused: string[] = Array.isArray(data?.unused) ? data.unused : [];
    if (unused.length === 0) {

      console.log("No unused exports detected. Nothing to trim.");
      return;
    }
    const limit = getLimit();
    targets = unused.slice(0, limit);

    console.log(`Using first ${targets.length} from usage.json 'unused'.`);
  }
  const toRemove = new Set(targets);

  // Handle organisms with export * statements
  if (TARGET === "organisms") {
    handleOrganismsExportStar(toRemove);
    return;
  }

  if (MODE === "barrel") {
    const content = readFileSync(CFG.barrel, "utf8");
    let modified = content;
    const notFound = new Set<string>();
    for (const exportName of toRemove) {
      const patterns = [
        new RegExp(`export\\s+\\*\\s+from\\s+['"\`]\\.\/[^'\"]*${exportName}['"\`]\\s*;\\s*`, 'g'),
        new RegExp(`export\\s+{\\s*${exportName}\\s*}([^;]*);\\s*`, 'g'),
        new RegExp(`export\\s+{\\s*${exportName}\\s*};\\s*`, 'g'),
      ];
      let found = false;
      for (const pattern of patterns) {
        if (pattern.test(modified)) {
          if (!DRY_RUN) modified = modified.replace(pattern, '');
          found = true;
          break;
        }
      }
      if (!found) notFound.add(exportName);
    }
    if (modified !== content && !DRY_RUN) {
      writeFileSync(CFG.barrel, modified);

      console.log(`✅ barrel trimmed (barrel mode).`);
      if (notFound.size) {

        console.log("\n⚠️ These names were not matched in export lists:");

        console.log("- " + Array.from(notFound).join("\n- "));
      }
    } else if (modified === content) {

      console.log("No matching named exports were found to trim at barrel level.");
    } else {

      console.log("DRY RUN: barrel changes not written.");
    }
    return;
  }

  // MODE === "declaration": remove 'export' at declaration sites in leaves
  const project = new Project({
    tsConfigFilePath: resolve(ROOT, "tsconfig.json"),
    skipAddingFilesFromTsConfig: false,
  });
  const barrel = project.getSourceFile(CFG.barrel);
  if (!barrel) {
    console.error(`❌ Could not find atoms barrel at: ${CFG.barrel}`);
    process.exit(2);
  }

  const exportMap = barrel.getExportedDeclarations();
  const skipped: string[] = [];
  const removed: string[] = [];
  const missing: string[] = [];
  for (const name of toRemove) {
    // Prefer exported declarations first
    let decls = exportMap.get(name);
    // If not exported from barrel, fall back to searching by name in project
    if ((!decls || decls.length === 0)) {
      const found: Node[] = [];
      for (const sf of project.getSourceFiles()) {
        const nodes = sf.getDescendants().filter(n => {
          if (Node.isInterfaceDeclaration(n) || Node.isTypeAliasDeclaration(n) ||
              Node.isFunctionDeclaration(n) || Node.isClassDeclaration(n) ||
              Node.isEnumDeclaration(n) || Node.isVariableStatement(n)) {
            // @ts-ignore
            const nodeName = Node.isVariableStatement(n)
              ? (n.getDeclarationList().getDeclarations()[0]?.getName?.() ?? "")
              : (n as any).getName?.() ?? "";
            return nodeName === name;
          }
          return false;
        });
        if (nodes.length) found.push(...nodes);
      }
      decls = found as any;
    }
    if (!decls || decls.length === 0) {
      missing.push(name);
      continue;
    }
    // Safety: ensure no imports anywhere
    if (isImportedAnywhere(project, name)) {
      skipped.push(name);
      continue;
    }
    let anyEdited = false;
    for (const d of decls) {
      // Don't touch ambient or lib files
      const sf = d.getSourceFile();
      const fp = sf.getFilePath();
      if (fp.includes(`${sep}node_modules${sep}`) || fp.endsWith('.d.ts')) continue;
      // Remove export modifier if applicable
      const ok = DELETE_NODE ? deleteDeclaration(d) : removeExportModifier(d);
      anyEdited = anyEdited || ok;
    }
    if (anyEdited) {
      removed.push(name);
    } else {
      skipped.push(name);
    }
  }
  if (!DRY_RUN) {
    project.saveSync();
  } else {

    console.log("DRY RUN: no files written.");
  }

  console.log(`Removed (declaration mode${DELETE_NODE ? " + delete" : ""}): ${removed.length}${removed.length ? ' → ' + removed.join(', ') : ''}`);
  if (skipped.length) {

    console.log(`Skipped (still imported or unsupported kind): ${skipped.join(', ')}`);
  }
  if (missing.length) {

    console.log(`Not found in export map: ${missing.join(', ')}`);
  }
}

main();

