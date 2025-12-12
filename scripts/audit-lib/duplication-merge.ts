/**
 * Unifies JSCPD processing:
 *  - Reads JSCPD JSON via --jscpd <path>
 *  - Optional --snippets to include representative code fragments
 *  - Inlines legacy skip logic (regexes) formerly in scripts/analysis/clone-skipper.ts
 *  - Outputs clustered "families" JSON to STDOUT (redirect to reports/duplication.json)
 *
 * Usage:
 *   pnpm -w tsx scripts/audit-lib/duplication-merge.ts --jscpd reports/jscpd-report.json [--snippets] > reports/duplication.json
 */
import fs from 'node:fs';
import path from 'node:path';

type Lines = { start: number; end: number };
type Dup = {
  format?: string;
  lines: number;
  tokens?: number;
  firstFile: string;
  secondFile: string;
  firstLines: Lines;
  secondLines: Lines;
  fragment?: string;
};
type JscpdJson = {
  duplicates?: Dup[];         // common
  duplications?: Dup[];       // older schema
  statistics?: unknown;
  version?: string;
};

function parseArgs(argv: string[]) {
  const args = new Set(argv.slice(2));
  const get = (flag: string) => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  const jscpd = get('--jscpd');
  const withSnippets = args.has('--snippets');
  if (!jscpd) {
    console.error('Usage: tsx scripts/audit-lib/duplication-merge.ts --jscpd <path> [--snippets]');
    process.exit(2);
  }
  return { jscpdPath: jscpd, withSnippets };
}

// ---- Skip logic (inlined from legacy clone-skipper) -------------------------
// Patterns extracted by audit; tuned to filter obvious boilerplate & noise.
const SKIP_PATTERNS: RegExp[] = [
  /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE)/m,                         // Next.js route handlers
  /export\s+default\s+\{[\s\S]*?title:\s*['"]/m,                                   // Storybook meta boilerplate
  /Props\s*=\s*\{[\s\S]+?\}/m,                                                     // Generic props object boilerplate
  /const\s+\w+\s*=\s*\{[\s\S]*?\}/m,                                               // Generic CSS-in-JS / plain object boilerplate
  /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[[^\]]*\]\s*\)/m,              // React useEffect scaffolding
  /^(export\s+)?(type|interface)\s+\w+/m                                           // Type/interface declarations
];

function shouldSkip(snippet: string): boolean {
  for (const rx of SKIP_PATTERNS) {
    if (rx.test(snippet)) return true;
  }
  return false;
}

// ---- Helpers ----------------------------------------------------------------
function readJson<T>(p: string): T {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as T;
}

function readLinesSlice(filePath: string, span: Lines): string {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    // Safely slice by lines to avoid expensive substring math for huge files
    const all = text.split(/\r?\n/);
    const start = Math.max(1, span.start);
    const end = Math.max(start, span.end);
    return all.slice(start - 1, end).join('\n');
  } catch {
    return '';
  }
}

function repSnippet(dup: Dup): string {
  if (dup.fragment && dup.fragment.trim()) return dup.fragment;
  // Fallback to first region
  return readLinesSlice(dup.firstFile, dup.firstLines);
}

function keyForPair(a: string, b: string): string {
  const A = a.split(path.sep).join('/'); // posix-ish
  const B = b.split(path.sep).join('/');
  return A <= B ? `${A}::${B}` : `${B}::${A}`;
}

// ---- Main -------------------------------------------------------------------
(() => {
  const { jscpdPath, withSnippets } = parseArgs(process.argv);
  const report = readJson<JscpdJson>(jscpdPath);
  const dups: Dup[] = (report.duplicates ?? report.duplications ?? []).filter(Boolean);

  let skipped = 0;
  let kept = 0;

  type Instance = {
    firstFile: string; secondFile: string;
    firstLines: Lines; secondLines: Lines;
    lines: number; tokens: number | undefined;
    snippet?: string;
  };

  type Family = {
    id: string;
    files: [string, string];
    instances: Instance[];
    maxLines: number;
    maxTokens: number | undefined;
  };

  const families = new Map<string, Family>();

  for (const dup of dups) {
    const pairKey = keyForPair(dup.firstFile, dup.secondFile);
    const snippet = withSnippets ? repSnippet(dup) : '';
    if (withSnippets && snippet && shouldSkip(snippet)) {
      skipped++;
      continue;
    }
    kept++;
    const fam = families.get(pairKey) ?? {
      id: pairKey,
      files: ((): [string, string] => {
        const [a, b] = pairKey.split('::');
        return [a, b] as [string, string];
      })(),
      instances: [],
      maxLines: 0,
      maxTokens: undefined as number | undefined
    };
    fam.instances.push({
      firstFile: dup.firstFile,
      secondFile: dup.secondFile,
      firstLines: dup.firstLines,
      secondLines: dup.secondLines,
      lines: dup.lines,
      tokens: dup.tokens,
      ...(withSnippets && snippet ? { snippet } : {})
    });
    fam.maxLines = Math.max(fam.maxLines, dup.lines);
    if (typeof dup.tokens === 'number') {
      fam.maxTokens = Math.max(fam.maxTokens ?? 0, dup.tokens);
    }
    families.set(pairKey, fam);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: { jscpdFile: jscpdPath, total: dups.length },
    counts: { families: families.size, instances: kept, skipped },
    families: [...families.values()].sort((a, b) => (b.maxTokens ?? b.maxLines) - (a.maxTokens ?? a.maxLines))
  };

  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
})();



