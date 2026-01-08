#!/usr/bin/env tsx
/**
 * Rewrites imports inside components/** that come from "@/components" or "@/components/ui"
 * into leaf module paths using the TS type checker. Dry-run by default; pass --write to apply.
 */
import path from 'node:path';
import type { ImportDeclaration } from 'ts-morph';
import { Project, SyntaxKind } from 'ts-morph';

const WRITE = process.argv.includes('--write');
const ROOT = process.cwd().replace(/\\/g, '/');

function toAlias(filePath: string) {
  const abs = filePath.replace(/\\/g, '/');
  const rel = abs.replace(`${ROOT}/`, '');
  if (rel.startsWith('components/')) return '@/'+rel;
  if (rel.startsWith('src/components/')) return '@/'+rel.slice('src/'.length);
  return '@/'+rel;
}

const project = new Project({
  tsConfigFilePath: path.join(ROOT, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: false,
});

const isInComponents = (p: string) => /(^|\/)components\//.test(p.replace(/\\/g, '/'));
// NOTE (2025-10-09): '@/components/index' was removed. Keep folder-scoped guards only.
const isRootBarrel = (spec: string) => (
  spec === '@/components' ||
  spec === '@/components/ui' ||
  spec === '@/components/ui/index'
);

const sourceFiles = project.getSourceFiles(['components/**/*.{ts,tsx}']);

let touched = 0;
for (const sf of sourceFiles) {
  const filePath = sf.getFilePath();
  const imports = sf.getDescendantsOfKind(SyntaxKind.ImportDeclaration);
  const toRemove: ImportDeclaration[] = [];
  const toAdd: Record<string, Set<string>> = {};

  for (const imp of imports) {
    const spec = imp.getModuleSpecifierValue();
    if (!isRootBarrel(spec)) continue;
    if (!isInComponents(filePath)) continue;

    const named = imp.getNamedImports();
    if (named.length === 0) continue;

    for (const n of named) {
      const node = n.getNameNode();
      const sym = node.getSymbol() ?? n.getAliasNode()?.getSymbol();
      if (!sym) continue;
      const decls = sym.getDeclarations();
      const declFile = decls?.[0]?.getSourceFile().getFilePath();
      if (!declFile) continue;
      const aliasPath = toAlias(declFile).replace(/(\.d)?\.(ts|tsx)$/,'');
      toAdd[aliasPath] ??= new Set<string>();
      toAdd[aliasPath].add(node.getText());
    }
    toRemove.push(imp);
  }

  if (toRemove.length) {
    touched++;
    for (const [aliasPath, names] of Object.entries(toAdd)) {
      sf.addImportDeclaration({
        moduleSpecifier: aliasPath,
        namedImports: Array.from(names).sort(),
      });
    }
    toRemove.forEach((i) => i.remove());
    if (WRITE) {
      sf.fixUnusedIdentifiers();
    }
  }
}

if (WRITE) {
  project.saveSync();
  console.log(`Applied rewrites to ${touched} files.`);
} else {
  console.log(`[dry-run] Would rewrite ${touched} files. Pass --write to apply.`);
}



