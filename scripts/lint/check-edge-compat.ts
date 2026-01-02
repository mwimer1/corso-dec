// Edge runtime guard:
// - Finds Edge entrypoints:
//    - middleware.ts (always Edge)
//    - app/**/{page,layout,route,error}.{ts,tsx} that export: export const runtime = 'edge'
// - Walks their import graphs (simple static scan) and flags:
//    - Node core modules (fs, path, crypto, etc.)
//    - Blocklisted packages (e.g., pg, mysql2, sharp, node-fetch, ioredis/redis)
//    - Common Node-only globals: process, Buffer, __dirname/__filename, require()
// - Also warns on process.env usage unless NEXT_PUBLIC_.
//
// Zero external deps. Alias @/ is resolved via project root.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

type Config = {
  roots: string[];
  denyNodeCore: string[];
  denyPackages: string[];
  allowPackages: string[];
  allowProcessEnvPublicPrefix?: string;
};

const ROOT = resolve(process.cwd());
const CFG_PATH = join(ROOT, "config/edge-compat.config.json");
const cfg: Config = JSON.parse(readFileSync(CFG_PATH, "utf8"));

const TS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
// Handles: export const runtime = 'edge'
//          export const runtime = 'edge' as const
//          export const runtime = 'edge' satisfies SomeType
const RUNTIME_EDGE_RE = /export\s+const\s+runtime\s*=\s*['"]edge['"]\s*(?:as\s+const|satisfies\s+[A-Za-z0-9_.$]+)?/m;
// SSG/ISR signals are incompatible with edge runtime on page/layout
const SSG_SIGNALS_RE = /(export\s+const\s+revalidate\s*=)|(export\s+async?\s*function\s+generateStaticParams)/m;
const IMPORT_RE = /\bimport\s*(?:[^'"]+from\s*)?['"]([^'"]+)['"]/g;
const EXPORT_FROM_RE = /\bexport\s*[^'"]*from\s*['"]([^'"]+)['"]/g;
const DYN_IMPORT_RE = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
const REQUIRE_RE = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
const PROCESS_RE = /\bprocess\./g;
const BUFFER_RE = /\bBuffer\b/g;
const TYPE_LINE_RE = /^\s*(?:export\s+)?type\b|^\s*interface\b|^\s*import\s+type\b/;
const DIRNAME_RE = /\b__dirname\b/g;
const FILENAME_RE = /\b__filename\b/g;

type Violation = {
  entry: string;
  chain: string[]; // import chain
  reason: string;
  spec?: string;
};

function isEdgeEntrypointCandidate(p: string): boolean {
  if (!p.startsWith(join(ROOT, "app"))) return false;
  const b = basenameNoExt(p);
  return ["page", "layout", "route", "error"].includes(b);
}

function basenameNoExt(p: string): string {
  const base = p.split(/[\\/]/).pop()!;
  const e = extname(base);
  return e ? base.slice(0, -e.length) : base;
}

function readSafe(file: string): string {
  try { return readFileSync(file, "utf8"); } catch { return ""; }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    try {
      const st = statSync(p);
      if (st.isDirectory()) out.push(...walk(p));
      else out.push(p);
    } catch { /* ignore */ }
  }
  return out;
}

function resolveSpecifier(fromFile: string, spec: string): { type: "node-core"|"package"|"file"; path?: string; name?: string } {
  // Node core? (handle node: prefix and subpaths like fs/promises, path/posix)
  const normalized = spec.startsWith("node:") ? spec.slice(5) : spec;
  const coreFirst = normalized.split("/")[0];
  if ((coreFirst && cfg.denyNodeCore.includes(coreFirst)) || (spec && cfg.denyNodeCore.includes(spec))) {
    return { type: "node-core", name: spec };
  }
  // Alias
  if (spec.startsWith("@/")) {
    const guess = tryResolveFile(join(ROOT, spec.slice(2)));
    if (guess) return { type: "file", path: guess };
  }
  // Relative
  if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/")) {
    const base = spec.startsWith("/")
      ? join(ROOT, spec)
      : join(dirname(fromFile), spec);
    const guess = tryResolveFile(base);
    if (guess) return { type: "file", path: guess };
  }
  // Package (bare)
  const pkgName = spec.split("/")[0]?.startsWith("@")
    ? spec.split("/").slice(0,2).join("/")
    : spec.split("/")[0];
  return { type: "package", name: pkgName || spec };
}

function tryResolveFile(base: string): string | undefined {
  if (existsSync(base) && statSafeIsFile(base)) return base;
  for (const ext of TS_EXTS) {
    const cand = base + ext;
    if (existsSync(cand) && statSafeIsFile(cand)) return cand;
  }
  for (const ext of TS_EXTS) {
    const cand = join(base, "index" + ext);
    if (existsSync(cand) && statSafeIsFile(cand)) return cand;
  }
  return undefined;
}
function statSafeIsFile(p: string): boolean { try { return statSync(p).isFile(); } catch { return false; } }

function scanImports(file: string, code: string): string[] {
  const specs = new Set<string>();
  for (const re of [IMPORT_RE, EXPORT_FROM_RE, DYN_IMPORT_RE, REQUIRE_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      if (m[1]) specs.add(m[1]);
    }
  }
  return [...specs];
}

function findEdgeEntries(): string[] {
  const entries = new Set<string>();
  for (const r of cfg.roots) {
    const p = join(ROOT, r);
    if (existsSync(p) && statSafeIsFile(p) && basenameNoExt(p) === "middleware") entries.add(p);
  }
  const appDir = join(ROOT, "app");
  if (existsSync(appDir)) {
    for (const file of walk(appDir)) {
      if (!isEdgeEntrypointCandidate(file)) continue;
      const code = readSafe(file);
      if (RUNTIME_EDGE_RE.test(code)) entries.add(file);
    }
  }
  return [...entries];
}

function checkNodeGlobals(code: string, entry: string, where: string, chain: string[], out: Violation[]) {
  if (REQUIRE_RE.test(code)) out.push({ entry, chain, reason: "require() not allowed in Edge" });
  if (DIRNAME_RE.test(code)) out.push({ entry, chain, reason: "__dirname not available in Edge" });
  if (FILENAME_RE.test(code)) out.push({ entry, chain, reason: "__filename not available in Edge" });
  if (BUFFER_RE.test(code)) {
    const lines = code.split(/\r?\n/);
    const offending = lines.some(l => /\bBuffer\b/.test(l) && !TYPE_LINE_RE.test(l));
    if (offending) out.push({ entry, chain, reason: "Buffer not available in Edge" });
  }
  const hasProcess = PROCESS_RE.test(code);
  if (hasProcess) {
    const publicPrefix = cfg.allowProcessEnvPublicPrefix ?? "NEXT_PUBLIC_";
    const envUse = code.match(/process\.env\.([A-Z0-9_]+)/g) || [];
    const offenders = envUse.filter((m) => !m.startsWith(`process.env.${publicPrefix}`));
    if (offenders.length) out.push({ entry, chain, reason: `process.env usage not allowed in Edge (${offenders.join(", ")})` });
  }
}

function traverse(entry: string, violations: Violation[]) {
  const seen = new Set<string>();
  const queue: { file: string; chain: string[] }[] = [{ file: entry, chain: [entry] }];

  while (queue.length) {
    const { file, chain } = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const code = readSafe(file);
    // Additional guard: page/layout with runtime='edge' must not use SSG/ISR signals
    const base = basenameNoExt(entry);
    if ((base === "page" || base === "layout") && file === entry) {
      if (SSG_SIGNALS_RE.test(code)) {
        violations.push({ entry, chain, reason: "edge runtime with SSG/ISR signals" });
      }
    }
    checkNodeGlobals(code, entry, file, chain, violations);
    const specs = scanImports(file, code);
    for (const spec of specs) {
      const resolved = resolveSpecifier(file, spec);
      if (resolved.type === "node-core") {
        violations.push({ entry, chain: [...chain, spec], reason: `Node core module not allowed in Edge`, spec });
        continue;
      }
      if (resolved.type === "package") {
        const name = resolved.name!;
        if (!cfg.allowPackages.includes(name)) {
          if (cfg.denyPackages.includes(name)) {
            violations.push({ entry, chain: [...chain, name], reason: `Disallowed package in Edge`, spec: name });
          }
        }
        continue;
      }
      if (resolved.type === "file" && resolved.path) {
        queue.push({ file: resolved.path, chain: [...chain, resolved.path] });
      }
    }
  }
}

function main() {
  const entries = findEdgeEntries();
  const violations: Violation[] = [];
  for (const e of entries) traverse(e, violations);

  if (!entries.length) {
    console.log("edge-guard: no Edge entrypoints detected (middleware or runtime='edge').");
    return;
  }

  if (!violations.length) {
    console.log(`edge-guard: OK (${entries.length} Edge entrypoint${entries.length>1?"s":""} scanned)`);
    return;
  }

  console.error(`edge-guard: Found ${violations.length} violation(s):`);
  for (const v of violations) {
    console.error("—".repeat(80));
    console.error(`Entry: ${v.entry}`);
    console.error(`Reason: ${v.reason}${v.spec ? ` [${v.spec}]` : ""}`);
    console.error("Chain:");
    for (const c of v.chain) console.error(`  → ${c}`);
  }
  process.exitCode = 1;
}

main();

