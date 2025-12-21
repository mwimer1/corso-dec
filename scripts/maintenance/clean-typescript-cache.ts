// scripts/maintenance/clean-typescript-cache.ts
 

import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, resolve } from "node:path";

type JsonObject = Record<string, unknown>;

function stripJsonc(input: string): string {
  // Remove // and /* */ comments safely (string-aware), then remove trailing commas.
  let out = "";
  let inString = false;
  let stringQuote: '"' | "'" | null = null;
  let escape = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        out += ch;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++; // skip '/'
      }
      continue;
    }

    if (inString) {
      out += ch;
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (stringQuote && ch === stringQuote) {
        inString = false;
        stringQuote = null;
      }
      continue;
    }

    // Not in string/comment
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++; // skip second '/'
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++; // skip '*'
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch as '"' | "'";
      out += ch;
      continue;
    }

    out += ch;
  }

  // Remove trailing commas: { "a": 1, } or [1,]
  out = out.replace(/,\s*([}\]])/g, "$1");
  return out;
}

function readJsoncFile(filePath: string): JsonObject | null {
  try {
    const raw = readFileSync(filePath, "utf8");
    try {
      return JSON.parse(raw) as JsonObject;
    } catch {
      const cleaned = stripJsonc(raw);
      return JSON.parse(cleaned) as JsonObject;
    }
  } catch {
    return null;
  }
}

function isLikelyLocalExtendsPath(ext: string): boolean {
  // tsconfig allows:
  // - relative paths ("./base.json")
  // - absolute paths (rare)
  // - package refs ("@tsconfig/node18/tsconfig.json")
  // We only resolve local-ish paths.
  if (!ext) return false;
  if (ext.startsWith(".")) return true;
  if (ext.startsWith("/")) return true;
  // Windows absolute like C:\...
  if (/^[a-zA-Z]:[\\/]/.test(ext)) return true;
  return false;
}

function resolveExtendsPath(tsconfigPath: string, extendsValue: string): string | null {
  if (!isLikelyLocalExtendsPath(extendsValue)) return null;

  const baseDir = dirname(tsconfigPath);
  let p = extendsValue;

  // TS lets you omit ".json" in extends sometimes
  if (!p.endsWith(".json")) p = `${p}.json`;

  const resolved = isAbsolute(p) ? normalize(p) : resolve(baseDir, p);
  return resolved;
}

function getCompilerOptions(obj: JsonObject): JsonObject {
  const co = obj["compilerOptions"];
  if (co && typeof co === "object" && !Array.isArray(co)) return co as JsonObject;
  return {};
}

function getString(obj: unknown): string | null {
  return typeof obj === "string" && obj.trim() ? obj : null;
}

function getEffectiveTsBuildInfoFile(
  tsconfigPath: string,
  visited = new Set<string>()
): string | null {
  const abs = resolve(tsconfigPath);

  if (visited.has(abs)) return null;
  visited.add(abs);

  const json = readJsoncFile(abs);
  if (!json) return null;

  const compilerOptions = getCompilerOptions(json);
  const direct = getString(compilerOptions["tsBuildInfoFile"]);
  if (direct) return direct;

  const ext = getString(json["extends"]);
  if (!ext) return null;

  const parentPath = resolveExtendsPath(abs, ext);
  if (!parentPath) return null;

  return getEffectiveTsBuildInfoFile(parentPath, visited);
}

function listFilesRecursive(dir: string, predicate: (path: string) => boolean): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      results.push(...listFilesRecursive(full, predicate));
      continue;
    }
    if (ent.isFile()) {
      if (predicate(full)) results.push(full);
    }
  }
  return results;
}

function listFilesShallow(dir: string, predicate: (path: string) => boolean): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isFile() && predicate(full)) results.push(full);
  }
  return results;
}

function safeRm(filePath: string): boolean {
  try {
    if (!existsSync(filePath)) return false;
    const st = statSync(filePath);
    if (!st.isFile()) return false;
    rmSync(filePath, { force: true });
    return true;
  } catch {
    return false;
  }
}

function rel(p: string): string {
  const cwd = process.cwd();
  const normalized = normalize(p);
  if (normalized.startsWith(cwd)) return normalized.slice(cwd.length + 1);
  return normalized;
}

function main() {
  const cwd = process.cwd();

  const targets = new Set<string>();

  // 1) Root legacy/default location (keep compatibility with existing scripts)
  targets.add(resolve(cwd, "tsconfig.tsbuildinfo"));

  // 2) Discover tsBuildInfoFile from root tsconfig.json (and its extends chain)
  const rootTsconfig = resolve(cwd, "tsconfig.json");
  if (existsSync(rootTsconfig)) {
    const tsBuildInfo = getEffectiveTsBuildInfoFile(rootTsconfig);
    if (tsBuildInfo) {
      const resolved =
        isAbsolute(tsBuildInfo) ? normalize(tsBuildInfo) : resolve(dirname(rootTsconfig), tsBuildInfo);
      targets.add(resolved);
    }
  }

  // 3) Discover tsBuildInfoFile from config/typescript/*.json (and extends chains)
  const configTsDir = resolve(cwd, "config", "typescript");
  const configJsons = listFilesShallow(configTsDir, (p) => p.endsWith(".json"));
  for (const tsconfigPath of configJsons) {
    const tsBuildInfo = getEffectiveTsBuildInfoFile(tsconfigPath);
    if (!tsBuildInfo) continue;

    const resolved =
      isAbsolute(tsBuildInfo) ? normalize(tsBuildInfo) : resolve(dirname(tsconfigPath), tsBuildInfo);
    targets.add(resolved);
  }

  // 4) Clean .cache/**/*.tsbuildinfo (recursive)
  const cacheDir = resolve(cwd, ".cache");
  const cacheBuildInfos = listFilesRecursive(cacheDir, (p) => p.endsWith(".tsbuildinfo"));
  for (const p of cacheBuildInfos) targets.add(p);

  // 5) Clean config/typescript/*.tsbuildinfo (shallow + safe)
  const legacyConfigBuildInfos = listFilesShallow(configTsDir, (p) => p.endsWith(".tsbuildinfo"));
  for (const p of legacyConfigBuildInfos) targets.add(p);

  const ordered = Array.from(targets).sort((a, b) => a.localeCompare(b));

  const deleted: string[] = [];
  const missing: string[] = [];
  const failed: string[] = [];

  for (const p of ordered) {
    if (!existsSync(p)) {
      missing.push(p);
      continue;
    }
    const ok = safeRm(p);
    if (ok) deleted.push(p);
    else failed.push(p);
  }

  // Output summary
  if (deleted.length === 0 && failed.length === 0) {
    console.log("TypeScript cache clean: no .tsbuildinfo files found.");
    process.exit(0);
  }

  console.log(`TypeScript cache clean: deleted ${deleted.length} file(s).`);
  if (deleted.length) {
    const max = 25;
    for (const p of deleted.slice(0, max)) console.log(`  - ${rel(p)}`);
    if (deleted.length > max) console.log(`  - ...and ${deleted.length - max} more`);
  }

  if (failed.length) {
    console.warn(`TypeScript cache clean: failed to delete ${failed.length} file(s):`);
    for (const p of failed) console.warn(`  - ${rel(p)}`);
    // Non-zero exit to catch real permission/path issues
    process.exit(1);
  }

  process.exit(0);
}

main();

