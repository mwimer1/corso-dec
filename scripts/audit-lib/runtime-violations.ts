// scripts/audit-lib/runtime-violations.ts
// Detect Edge modules importing Node-only, and Node-only modules missing 'server-only'
import { promises as fs } from 'fs';
import path from 'path';

type Violation = {
  file: string;
  kind: 'EDGE_IMPORTS_NODE' | 'NODE_MISSING_SERVER_ONLY';
  details: string;
  severity: 'P0' | 'P1';
};

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, acc);
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      acc.push(full);
    }
  }
  return acc;
}

function isNodeImport(src: string): boolean {
  return (
    src.includes("from '@clerk/nextjs/server'") ||
    src.includes("from 'next/headers'") ||
    src.includes("from '@/lib/server/") ||
    src.includes("require('@/lib/server/")
  );
}

function isEdgeModule(src: string, filePath: string): boolean {
  if (src.includes("import 'server-only'")) return false;
  if (/\/client\.(ts|tsx)$/.test(filePath)) return true;
  // Heuristic: absence of node-only imports implies Edge/Unknown; we'll treat as Edge for safety
  return !isNodeImport(src);
}

async function main() {
  const root = path.resolve(process.cwd(), 'lib');
  const files = await walk(root);
  const violations: Violation[] = [];

  for (const f of files) {
    const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
    const src = await fs.readFile(f, 'utf8');
    const hasServerOnly = src.includes("import 'server-only'");
    const importsNode = isNodeImport(src);
    const isEdge = isEdgeModule(src, f);

    if (isEdge && importsNode) {
      violations.push({
        file: rel,
        kind: 'EDGE_IMPORTS_NODE',
        details: 'Edge-like module imports Node-only APIs (@/lib/server, next/headers, or Clerk server).',
        severity: 'P0',
      });
    }

    if (importsNode && !hasServerOnly) {
      violations.push({
        file: rel,
        kind: 'NODE_MISSING_SERVER_ONLY',
        details: "Node-only module missing `import 'server-only'` guard.",
        severity: 'P1',
      });
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    count: violations.length,
    violations,
  };
  process.stdout.write(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



