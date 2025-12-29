/**
 * Safely trims unused named exports from styles/ui/organisms/index.ts.
 * - Reads usage JSON produced by analysis scripts
 * - Respects an allowlist to protect critical/menu/layout families
 * - DRY-RUN by default; pass --write to persist changes
 *
 * Example:
 *   pnpm cleanup:cleanup:organisms:trim                 # dry-run
 *   pnpm cleanup:cleanup:organisms:trim -- --write      # apply
 */
import fs from "node:fs";
import path from "node:path";
import type { SourceFile } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import { backupFile, createProject, loadJson } from "../utils/barrel-trim";

type Usage = {
  allExports: number;
  used: number;
  unused: number;
  usedNames: string[];
  unusedNames: string[];
};

function argFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}
function argVal(name: string, fallback?: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(eq.indexOf("=") + 1).replace(/^"|"$/g, "");
  const bare = process.argv.find((a) => a === `--${name}`);
  if (bare) {
    const next = process.argv[process.argv.indexOf(bare) + 1];
    return next && !next.startsWith("--") ? next : fallback;
  }
  return fallback;
}

const ROOT = process.cwd();
const SOURCE = path.join(
  ROOT,
  argVal("source", "styles/ui/organisms/index.ts")!
);
const USAGE = path.join(
  ROOT,
  argVal("usage", "scripts/.cache/organisms-styles-usage.json")!
);
const ALLOW = path.join(
  ROOT,
  argVal(
    "allowlist",
    "scripts/analysis/data/organisms-keep-allowlist.json"
  )!
);
const WRITE = argFlag("write");

// Using shared utilities from barrel-trim.ts

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function removeNamedExportByName(ed: any, name: string): boolean {
  const ne = ed.getNamedExports().find((n: any) => n.getName() === name);
  if (!ne) return false;
  ne.remove();
  return true;
}

function removeTopLevelDeclarationByName(
  source: SourceFile,
  name: string
): boolean {
  // Handle: export const X ..., export function X ..., export class X ..., export type X = ...
  const decls = source.getExportedDeclarations().get(name);
  if (!decls?.length) return false;
  let removed = 0;
  for (const d of decls) {
    // Find the actual declaration node that can be removed
    const removableNode = d.getFirstAncestorByKind(SyntaxKind.VariableStatement) ??
      d.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ??
      d.getFirstAncestorByKind(SyntaxKind.ClassDeclaration) ??
      d.getFirstAncestorByKind(SyntaxKind.InterfaceDeclaration) ??
      d.getFirstAncestorByKind(SyntaxKind.TypeAliasDeclaration) ??
      d.getFirstAncestorByKind(SyntaxKind.EnumDeclaration);

    if (removableNode) {
      // @ts-ignore - These specific node types all have remove() method in ts-morph
      removableNode.remove();
      removed++;
    }
  }
  return removed > 0;
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source barrel not found: ${path.relative(ROOT, SOURCE)}`);
    process.exit(1);
  }
  if (!fs.existsSync(USAGE)) {
    console.error(`Usage JSON not found: ${path.relative(ROOT, USAGE)}`);
    process.exit(1);
  }
  if (!fs.existsSync(ALLOW)) {
    console.error(`Allowlist JSON not found: ${path.relative(ROOT, ALLOW)}`);
    process.exit(1);
  }

  const usage = loadJson<Usage>(USAGE, ROOT);
  const allow = new Set(loadJson<string[]>(ALLOW, ROOT));

  const toRemove = usage.unusedNames.filter((n) => !allow.has(n)).sort();
  if (toRemove.length === 0) {
    console.log("Nothing to remove (either none unused or all are allowlisted).");
    return;
  }

  const project = createProject(path.join(ROOT, "tsconfig.json"), { skipAddingFilesFromTsConfig: true });
  const source = project.addSourceFileAtPath(SOURCE);

  type Change = { module?: string; names: string[]; kind: "reexport" | "declaration" };
  const changes: Change[] = [];

  // 1) Remove names from `export { ... } from "./x"`
  for (const ed of source.getExportDeclarations()) {
    const removedHere: string[] = [];
    for (const name of toRemove) {
      if (removeNamedExportByName(ed, name)) removedHere.push(name);
    }
    if (removedHere.length) {
      if (ed.getNamedExports().length === 0) ed.remove();
      const moduleSpecifier = ed.getModuleSpecifierValue();
      if (moduleSpecifier) {
        changes.push({
          module: moduleSpecifier,
          names: removedHere,
          kind: "reexport"
        });
      }
    }
  }

  // 2) Remove any top-level exported declarations with those names (rare in barrels, but safe).
  const removedDecls: string[] = [];
  for (const name of toRemove) {
    if (removeTopLevelDeclarationByName(source, name)) removedDecls.push(name);
  }
  if (removedDecls.length) {
    changes.push({ names: removedDecls, kind: "declaration" });
  }

  // Output
  const summary =
    changes.length === 0
      ? "No matching named exports found in barrel."
      : changes
          .map((c) =>
            c.kind === "reexport"
              ? `- ${c.module}: ${c.names.join(", ")}`
              : `- declarations: ${c.names.join(", ")}`
          )
          .join("\n");

  if (!WRITE) {
    console.log("DRY-RUN — would remove the following unused names not in allowlist:\n");
    console.log(summary || "(none)");
    return;
  }

  const bak = backupFile(SOURCE);
  source.formatText({ indentSize: 2, convertTabsToSpaces: true });
  source.saveSync();

  console.log(
    `Applied trim to ${path.relative(ROOT, SOURCE)} (${plural(
      toRemove.length,
      "symbol",
      "symbols"
    )} targeted). Backup saved as ${path.relative(ROOT, bak)}.\n\n` + summary
  );
}

main();



