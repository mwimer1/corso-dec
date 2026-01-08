import fg from "fast-glob";
import fs from "fs";
import path from "path";
import ts from "typescript";

// Helper: read tsconfig paths
function readTsconfigPaths(root: string) {
  const cfgPath = path.join(root, "tsconfig.json");
  if (!fs.existsSync(cfgPath)) return {};
  const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile).config;
  const compilerOptions = cfg.compilerOptions || {};
  return compilerOptions.paths || {};
}

// Simple generator: scans app routes for route.ts files and extracts runtime and methods from a minimal export pattern
async function main() {
  const root = process.cwd();
  const outDir = path.join(root, ".agent");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const routes: Record<string, any> = {};

  const files = await fg(["app/**/route.ts", "app/**/route.tsx"], { dot: true });
  for (const f of files) {
    const full = path.join(root, f);
    const content = fs.readFileSync(full, "utf8");

    // best-effort: look for exported runtime and method handlers (GET/POST/PUT/PATCH/DELETE)
    const runtimeMatch = content.match(/export const runtime\s*=\s*["'](edge|nodejs|node)\b/);
    const runtime = runtimeMatch ? (runtimeMatch[1] === "node" ? "nodejs" : runtimeMatch[1]) : "nodejs";

    const methods: string[] = [];
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      const re = new RegExp(`export (?:const|async function) ${m}\\b`, "m");
      if (re.test(content)) methods.push(m);
    }

    // build path by mapping file path back to route path
    const routePath = f
      .replace(/^app/, "")
      .replace(/route\.tsx?$/, "")
      .replace(/index\/$/, "")
      .replace(/\\/g, "/");

    routes[routePath || "/"] = {
      methods: methods.length ? methods : ["GET"],
      runtime,
      file: f,
    };
  }

  fs.writeFileSync(path.join(outDir, "routes.index.json"), JSON.stringify(routes, null, 2));
  // Build aliases index from tsconfig paths
  const paths = readTsconfigPaths(root);
  const aliases: Record<string, any> = {};
  for (const [key, vals] of Object.entries(paths)) {
    aliases[key] = { paths: vals };
  }
  fs.writeFileSync(path.join(outDir, "aliases.index.json"), JSON.stringify(aliases, null, 2));

  // Build barrels index: look for index.ts files that export symbols (best-effort)
  const barrels: Record<string, string[]> = {};
  const indexFiles = await fg(["**/index.ts", "**/index.tsx"], { dot: true, ignore: ["node_modules/**", "**/dist/**", ".next/**"] });
  for (const idx of indexFiles) {
    try {
      const content = fs.readFileSync(path.join(root, idx), "utf8");
      const sf = ts.createSourceFile(idx, content, ts.ScriptTarget.ESNext, true);
      const names: string[] = [];

      sf.forEachChild((node) => {
        // export const foo = ... or export function foo() {}
        if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
          for (const decl of node.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) names.push(decl.name.text);
          }
        }

        if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
          if (node.name && ts.isIdentifier(node.name)) names.push(node.name.text);
        }

        // export { a, b } from './x'
        if (ts.isExportDeclaration(node)) {
          const ed = node as ts.ExportDeclaration;
          if (ed.exportClause && ts.isNamedExports(ed.exportClause)) {
            for (const e of ed.exportClause.elements) {
              names.push(e.name.getText(sf));
            }
          } else if (!ed.exportClause && ed.moduleSpecifier) {
            // export * from '...'
            names.push("*");
          }
        }

        // export { a, b };
        if (ts.isExportAssignment(node)) {
          names.push("default");
        }
      });

      if (names.length) barrels[idx] = names;
    } catch (err) {
      // ignore parse errors
    }
  }
  fs.writeFileSync(path.join(outDir, "barrels.index.json"), JSON.stringify(barrels, null, 2));
  console.log("Wrote .agent/routes.index.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});



