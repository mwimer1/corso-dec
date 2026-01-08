// scripts/audit-lib/inventory.ts
// Build an inventory of lib/** with domain, runtime guess, exports, deps, env usage
import { promises as fs } from 'fs';
import path from 'path';

type FileInfo = {
  file: string;
  domain: string;
  runtime: 'Edge' | 'Node' | 'Unknown';
  exports: string[];
  outboundImports: string[];
  inboundRefs: number; // filled heuristically later (0 placeholder)
  envUsage: string[]; // getEnv/requireServerEnv/process.env
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

function guessRuntime(filePath: string, src: string): 'Edge' | 'Node' | 'Unknown' {
  if (src.includes("import 'server-only'")) return 'Node';
  if (/\/client\.(ts|tsx)$/.test(filePath)) return 'Edge';
  if (src.match(/from ['"]@\/lib\/server\//)) return 'Node';
  if (src.match(/from ['"]next\/headers['"]/)) return 'Node';
  if (src.match(/from ['"]@clerk\/nextjs\/server['"]/)) return 'Node';
  return 'Unknown';
}

function getDomain(filePath: string): string {
  const parts = filePath.split(path.sep);
  const libIdx = parts.lastIndexOf('lib');
  const next = parts[libIdx + 1];
  return libIdx >= 0 && typeof next === 'string' ? next : 'lib';
}

function parseExports(src: string): string[] {
  const names = new Set<string>();
  const exportRegex = /export\s+(?:const|function|class|type|interface|enum)\s+([\w$]+)/g;
  let m: RegExpExecArray | null;
  while ((m = exportRegex.exec(src))) {
    const name = m?.[1];
    if (name) names.add(name);
  }
  const namedReexport = /export\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
  while ((m = namedReexport.exec(src))) {
    const block = m?.[1] ?? '';
    block
      .split(',')
      .map((s) => s.trim())
      .forEach((n) => {
        if (!n) return;
        names.add(n.replace(/\s+as\s+.*/, ''));
      });
  }
  return Array.from(names);
}

function parseImports(src: string): string[] {
  const out: string[] = [];
  const importRegex = /import\s+[^'";]+from\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(src))) {
    const val = m?.[1];
    if (val) out.push(val);
  }
  return out;
}

async function main() {
  const root = path.resolve(process.cwd(), 'lib');
  const files = await walk(root);
  const items: FileInfo[] = [];
  for (const f of files) {
    const src = await fs.readFile(f, 'utf8');
    const info: FileInfo = {
      file: path.relative(process.cwd(), f).replace(/\\/g, '/'),
      domain: getDomain(f),
      runtime: guessRuntime(f, src),
      exports: parseExports(src),
      outboundImports: parseImports(src),
      inboundRefs: 0,
      envUsage: [
        ...(src.includes('getEnv(') ? ['getEnv'] : []),
        ...(src.includes('requireServerEnv(') ? ['requireServerEnv'] : []),
        ...(src.includes('process.env') ? ['process.env'] : []),
      ],
    };
    items.push(info);
  }
  const output = {
    generatedAt: new Date().toISOString(),
    root: 'lib',
    count: items.length,
    items,
  };
  process.stdout.write(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



