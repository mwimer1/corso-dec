import path from "node:path";
import fs from "node:fs";
import { Project, Node } from "ts-morph";
import type { SyntaxKind, SourceFile, ExportDeclaration, ImportDeclaration } from "ts-morph";

const ROOT = process.cwd();
const TS_CONFIG = path.join(ROOT, "tsconfig.json");

// We rewrite imports that point at the removed aggregator or its submodules.
const SHARED_PREFIXES = [
  "@/styles/ui/shared",
];

// Build a symbol → module path map by scanning styles/ui/** for real export sites.
type SymbolMap = Map<string, string>; // e.g., "containerMaxWidthVariants" -> "@/styles/ui/shared/container-max-width"

function asAliasModule(absTsPath: string) {
  const rel = path.relative(ROOT, absTsPath).replace(/\\/g, "/");
  return "@/" + rel.replace(/\.tsx?$/, "");
}

function addIfEmpty(m: SymbolMap, name: string, mod: string) {
  if (!m.has(name)) m.set(name, mod);
}

function collectFromIndexReexports(sf: SourceFile, map: SymbolMap) {
  // For index.ts files that do: export { A, B } from './x'
  const dir = path.dirname(sf.getFilePath());
  for (const ed of sf.getExportDeclarations()) {
    const ns = ed.getNamespaceExport();
    if (ns) continue;
    const spec = ed.getModuleSpecifierValue();
    if (!spec) continue;
    const target = path.resolve(dir, spec + (spec.endsWith(".ts") || spec.endsWith(".tsx") ? "" : ".ts"));
    const modulePath = asAliasModule(fs.existsSync(target) ? target : path.resolve(dir, spec));
    for (const ne of ed.getNamedExports()) {
      const exported = ne.getAliasNode()?.getText() ?? ne.getNameNode().getText();
      addIfEmpty(map, exported, modulePath);
    }
  }
}

function collectFromLocalDecls(sf: SourceFile, map: SymbolMap) {
  // For files that declare exports locally (const/func/type/interface/class)
  sf.forEachChild((node) => {
    const isExported =
      (Node.isVariableStatement(node) && node.hasExportKeyword()) ||
      (Node.isFunctionDeclaration(node) && node.hasExportKeyword()) ||
      (Node.isTypeAliasDeclaration(node) && node.hasExportKeyword()) ||
      (Node.isInterfaceDeclaration(node) && node.hasExportKeyword()) ||
      (Node.isClassDeclaration(node) && node.hasExportKeyword());
    if (!isExported) return;
    const names: string[] = [];
    if (Node.isVariableStatement(node)) {
      for (const d of node.getDeclarationList().getDeclarations()) {
        const id = d.getNameNode();
        if (Node.isIdentifier(id)) names.push(id.getText());
      }
    } else {
      const id = (node as any).getName?.();
      if (id) names.push(id);
    }
    for (const n of names) addIfEmpty(map, n, asAliasModule(sf.getFilePath()));
  });
}

function buildSymbolMap(project: Project): SymbolMap {
  const map: SymbolMap = new Map();
  // Only scan style sources
  const styleFiles = project.getSourceFiles("styles/ui/**/*.ts");
  for (const sf of styleFiles) {
    const isIndex = /\/index\.ts$/.test(sf.getFilePath());
    if (isIndex) collectFromIndexReexports(sf, map);
    collectFromLocalDecls(sf, map);
  }
  return map;
}

function startsWithAny(s: string, prefixes: string[]) {
  return prefixes.some((p) => s === p || s.startsWith(p + "/"));
}

function rewriteSharedImports(project: Project, map: SymbolMap) {
  const files = project.getSourceFiles("**/*.{ts,tsx}");
  const unresolved: Array<{ file: string; names: string[]; from: string }> = [];
  let changedCount = 0;

  for (const sf of files) {
    let changed = false;
    for (const imp of sf.getImportDeclarations()) {
      const spec = imp.getModuleSpecifierValue();
      if (!spec || !startsWithAny(spec, SHARED_PREFIXES)) continue;

      const named = imp.getNamedImports();
      if (named.length === 0) continue;

      // Partition symbols by whether we can resolve them to a module
      const resolvable: Array<{ name: string; target: string }> = [];
      const missing: string[] = [];
      for (const ni of named) {
        const exported = ni.getAliasNode()?.getText() ?? ni.getNameNode().getText();
        const target = map.get(exported);
        if (target) resolvable.push({ name: exported, target });
        else missing.push(exported);
      }
      if (resolvable.length === 0) {
        if (missing.length) {
          unresolved.push({ file: sf.getFilePath(), names: missing, from: spec });
        }
        continue;
      }

      // Group by target module and create/merge imports
      const byMod = new Map<string, string[]>();
      for (const r of resolvable) {
        byMod.set(r.target, (byMod.get(r.target) ?? []).concat(r.name));
      }
      for (const [mod, names] of byMod.entries()) {
        const existing = sf.getImportDeclarations().find(d => d.getModuleSpecifierValue() === mod);
        if (existing) {
          const existingNames = new Set(existing.getNamedImports().map(n => n.getNameNode().getText()));
          for (const nm of names) if (!existingNames.has(nm)) existing.addNamedImport(nm);
        } else {
          sf.addImportDeclaration({ moduleSpecifier: mod, namedImports: names });
        }
      }

      // Reduce/remove the original import
      if (missing.length === 0) {
        imp.remove();
      } else {
        imp.removeNamedImports();
        for (const nm of missing) imp.addNamedImport(nm);
      }
      changed = true;
    }
    if (changed) {
      sf.fixMissingImports();
      sf.saveSync();
      changedCount++;
    }
  }

  return { changedCount, unresolved };
}

function main() {
  const project = new Project({ tsConfigFilePath: TS_CONFIG });
  const map = buildSymbolMap(project);
  const { changedCount, unresolved } = rewriteSharedImports(project, map);
  console.log(`✅ Rewrote imports in ${changedCount} file(s).`);
  if (unresolved.length) {
    console.log("\n⚠️  Unresolved symbols (not found in styles/ui/** exports):");
    const byFile = new Map<string, Set<string>>();
    for (const u of unresolved) {
      const rel = path.relative(ROOT, u.file).replace(/\\/g, "/");
      const set = byFile.get(rel) ?? new Set<string>();
      u.names.forEach(n => set.add(n));
      byFile.set(rel, set);
    }
    for (const [file, set] of byFile.entries()) {
      console.log(` - ${file}: ${Array.from(set).sort().join(", ")}`);
    }
    process.exitCode = 2;
  }
}

main();



