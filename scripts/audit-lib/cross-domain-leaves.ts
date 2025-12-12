// scripts/audit-lib/cross-domain-leaves.ts
// Find imports that bypass barrels or cross-domain leaves (e.g., '@/lib/auth/subdir/foo')
import { promises as fs } from 'fs';
import path from 'path';

type Finding = {
  file: string;
  import: string;
  reason: 'cross-domain-leaf' | 'missing-barrel';
  severity: 'P1' | 'P2';
};

const DOMAIN_NAMES = new Set([
  'actions','api','auth','chat','config','core','dashboard','integrations','marketing','middleware','monitoring','onboarding','ratelimiting','security','server','shared','validators','mocks'
]);

function isAlias(s: string) { return s.startsWith('@/'); }

function parseDomainFromAlias(alias: string): string | null {
  const rest = alias.replace(/^@\//, ''); // e.g. lib/auth/server
  const parts = rest.split('/');
  if (parts[0] === 'lib' && parts.length > 1) return parts[1] ?? null;
  const head = parts[0] ?? null;
  if (head && DOMAIN_NAMES.has(head)) return head;
  return null;
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) acc.push(full);
  }
  return acc;
}

function parseImports(src: string): string[] {
  const out: string[] = [];
  const importRegex = /import\s+[^'";]+from\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(src))) out.push(m[1] ?? '');
  return out.filter(Boolean);
}

async function main() {
  const root = path.resolve(process.cwd(), 'lib');
  const files = await walk(root);
  const findings: Finding[] = [];

  for (const f of files) {
    const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
    const src = await fs.readFile(f, 'utf8');
    const imports = parseImports(src).filter(isAlias);
    for (const imp of imports) {
      // Bypass barrels if goes deeper than domain root, except explicit approved barrels (e.g., '@/lib/auth/server' is allowed if domain barrel)
      const domain = parseDomainFromAlias(imp);
      if (!domain) continue;
      const afterDomain = imp.replace(/^@\//, '').replace(/^lib\//, '');
      const parts = afterDomain.split('/').filter(Boolean);
      // Allowed: '@/lib/<domain>' root; also allow '@/lib/<domain>/server' and '@/lib/<domain>/client' as entrypoints
      const isRoot = parts.length === 1; // <domain>
      const isEntry = parts.length === 2 && (parts[1] === 'server' || parts[1] === 'client');
      if (!isRoot && !isEntry) {
        findings.push({
          file: rel,
          import: imp,
          reason: 'cross-domain-leaf',
          severity: 'P1',
        });
      }
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    count: findings.length,
    findings,
  };
  process.stdout.write(JSON.stringify(out, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });



