/**
 * Leaf-level export trimmer for UI barrels that mostly use `export * from`.
 *
 * Supports removing the `export` modifier at declaration sites when a symbol is
 * confirmed unused across the repo.
 *
 * Safety:
 *  - Before editing a declaration, scan ALL source files for any import of that
 *    symbol from ANY path. If found, skip and warn.
 *  - Supports a dry-run mode.
 *
 * Usage examples:
 *   tsx scripts/analysis/trim-exports-declaration.ts --target=components --names=A,B
 *   tsx scripts/analysis/trim-exports-declaration.ts --target=styles --limit=20
 *   tsx scripts/analysis/trim-exports-declaration.ts --target=components --dry-run
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createProject, isImportedAnywhere, removeExportModifier } from "../utils/barrel-trim";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const ROOT = resolve(__dirname, "..", "..");
const TARGET = (process.argv.find(a => a.startsWith("--target="))?.split("=")[1] ?? "components") as "styles" | "components";
const DRY_RUN = process.argv.includes("--dry-run");

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
}[TARGET];

function getLimit(): number {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  if (!arg) return 15;
  const n = Number(arg.split("=")[1] ?? "15");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 15;
}

function getExplicitNames(): string[] | null {
  const arg = process.argv.find((a) => a.startsWith("--names="));
  if (!arg) return null;
  return arg.split("=")[1]?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
}

function ensureReport() {
  if (!existsSync(CFG.report)) {
    const flag = TARGET === "components" ? "--target=components" : "--target=styles";
     
    console.log(`No atoms usage report found for '${TARGET}'; generating…`);
    execSync(`tsx scripts/analysis/scan-atoms-usage.ts ${flag}`, { stdio: "inherit" });
  }
}

// Using shared utilities from barrel-trim.ts

function main() {
  // Resolve target names
  let targets: string[] | null = getExplicitNames();
  if (!targets || targets.length === 0) {
    ensureReport();
    const data = existsSync(CFG.report) ? JSON.parse(readFileSync(CFG.report, "utf8")) : null;
    const unused: string[] = Array.isArray(data?.unused) ? data.unused : [];
    if (unused.length === 0) {
       
      console.log("No unused atom exports detected. Nothing to trim.");
      return;
    }
    targets = unused.slice(0, getLimit());
     
    console.log(`Using first ${targets.length} from usage 'unused'.`);
  } else {
     
    console.log("Using explicit trim list:", targets.join(", "));
  }
  const toRemove = new Set(targets);

  const project = createProject(resolve(ROOT, "tsconfig.json"));
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
    const decls = exportMap.get(name);
    if (!decls || decls.length === 0) {
      missing.push(name);
      continue;
    }
    if (isImportedAnywhere(project, name, [`${sep}node_modules${sep}`, `${sep}.next${sep}`, `${sep}.turbo${sep}`])) {
      skipped.push(name);
      continue;
    }
    let anyEdited = false;
    for (const d of decls) {
      const sf = d.getSourceFile();
      const fp = sf.getFilePath();
      if (fp.includes(`${sep}node_modules${sep}`) || fp.endsWith('.d.ts')) continue;
      const ok = removeExportModifier(d);
      anyEdited = anyEdited || ok;
    }
    if (anyEdited) removed.push(name); else skipped.push(name);
  }

  if (!DRY_RUN) {
    project.saveSync();
  } else {
     
    console.log("DRY RUN: no files written.");
  }
   
  console.log(`Removed (declaration mode): ${removed.length}${removed.length ? ' → ' + removed.join(', ') : ''}`);
  if (skipped.length) {
     
    console.log(`Skipped (still imported or unsupported kind): ${skipped.join(', ')}`);
  }
  if (missing.length) {
     
    console.log(`Not found in export map: ${missing.join(', ')}`);
  }
}

main();



