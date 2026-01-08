#!/usr/bin/env -S node
/**
 * Minimal README/docs freshness tool.
 * - write mode: ensures a "Last updated: YYYY-MM-DD" line exists/updated
 * - check mode: exits 1 if any tracked file is older than --maxAgeDays
 *
 * Usage:
 *   tsx docs/_scripts/freshen.ts --mode=write
 *   tsx docs/_scripts/freshen.ts --mode=check --maxAgeDays=30
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

type Mode = "write" | "check";

function parseArgs(): { mode: Mode; maxAgeDays: number } {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a && a.startsWith("--")) {
      const [k, v] = a.includes("=") ? a.split("=", 2) : [a, process.argv[i + 1]];
      if (k) {
        args.set(k, v ?? "");
      }
      if (a && !a.includes("=")) i++;
    }
  }
  const mode = (args.get("--mode") as Mode) ?? "check";
  const maxAgeDays = Number(args.get("--maxAgeDays") ?? "30");
  return { mode, maxAgeDays: Number.isFinite(maxAgeDays) ? maxAgeDays : 30 };
}

function* walkDirs(dir: string): Generator<string> {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      // skip common build or hidden dirs
      if (e.name.startsWith(".") || ["node_modules", "dist", "build", ".next"].includes(e.name)) continue;
      yield* walkDirs(p);
    } else {
      yield p;
    }
  }
}

function isoToday(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const FRESH_MARK = "Last updated:";
const today = isoToday();
const { mode, maxAgeDays } = parseArgs();

// Track only README-like markdown in root and docs/**
const candidates: string[] = [];
for (const p of ["README.md", "readme.md"]) {
  try {
    statSync(p); candidates.push(p);
  } catch {}
}
try {
  for (const f of walkDirs("docs")) {
    if (extname(f).toLowerCase() === ".md" && /readme/i.test(f)) candidates.push(f);
  }
} catch {}

let staleCount = 0;
for (const file of candidates) {
  let content = readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  const idx = lines.findIndex(l => l.startsWith(FRESH_MARK));

  if (mode === "write") {
    const line = `${FRESH_MARK} ${today}`;
    if (idx >= 0) {
      if (lines[idx] !== line) {
        lines[idx] = line;
        writeFileSync(file, lines.join("\n"));
        console.log(`updated: ${file}`);
      }
    } else {
      // Insert after first heading or at top
      const h = lines.findIndex(l => l.startsWith("#"));
      const insertAt = h >= 0 ? h + 1 : 0;
      lines.splice(insertAt, 0, "", line);
      writeFileSync(file, lines.join("\n"));
      console.log(`inserted: ${file}`);
    }
  } else {
    // check mode
    if (idx < 0) {
      console.warn(`stale (no marker): ${file}`);
      staleCount++;
      continue;
    }
    const m = lines[idx]?.match(/^Last updated:\s*(\d{4}-\d{2}-\d{2})$/);
    if (!m) {
      console.warn(`stale (unparseable): ${file}`);
      staleCount++;
      continue;
    }
    const last = new Date(`${m[1]}T00:00:00Z`).getTime();
    const ageDays = Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
    if (ageDays > maxAgeDays) {
      console.warn(`stale (${ageDays}d > ${maxAgeDays}d): ${file}`);
      staleCount++;
    }
  }
}

if (mode === "check" && staleCount > 0) {
  console.error(`Docs freshness check failed: ${staleCount} stale file(s).`);
  process.exit(1);
}

