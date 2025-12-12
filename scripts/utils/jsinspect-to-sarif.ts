#!/usr/bin/env tsx
/**
 * Convert JSInspect JSON to SARIF 2.1.0 for GitHub code scanning.
 * Usage: tsx tools/scripts/jsinspect-to-sarif.ts [--in <input.json>] [--out <output.sarif>]
 */
import fs from "node:fs";
import path from "node:path";

type Instance = { path: string; lines?: [number, number] | number[] };
type Match = { id?: string | number; instances: Instance[]; reason?: string };
type JSInspectReport = { matches?: Match[] } | Match[];

// CLI argument parsing for input/output paths
const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const REPORTS_ROOT = process.env['REPORTS_ROOT'] ?? "reports";
const DEFAULT_IN = path.join(REPORTS_ROOT, "duplication", "jsinspect.json");
const DEFAULT_OUT = path.join(REPORTS_ROOT, "duplication", "jsinspect.sarif");
const inPath = arg("--in", DEFAULT_IN);
const outPath = arg("--out", DEFAULT_OUT);

if (!inPath || !outPath) {
  console.error("Usage: tsx tools/scripts/jsinspect-to-sarif.ts [--in <input.json>] [--out <output.sarif>]");
  process.exit(2);
}

const raw = fs.readFileSync(inPath, "utf8");
const data: JSInspectReport = JSON.parse(raw);
const matches: Match[] = Array.isArray(data) ? data : (data.matches ?? []);

const results: any[] = [];
for (const [idx, m] of matches.entries()) {
  const instances = (m.instances || []).filter((x) => !!x?.path);
  if (instances.length === 0) continue;

  const primary = instances[0]!;
  const region = (() => {
    const lines = primary.lines ?? [];
    const start = Math.max(1, Number(lines[0] ?? 1));
    const end = Math.max(start, Number(lines[1] ?? start));
    return { startLine: start, endLine: end };
  })();

  const relatedLocations = instances.slice(1).map((inst, i) => {
    const lines = inst.lines ?? [];
    const s = Math.max(1, Number(lines[0] ?? 1));
    const e = Math.max(s, Number(lines[1] ?? s));
    return {
      id: i + 1,
      physicalLocation: {
        artifactLocation: { uri: inst.path.replace(/\\/g, "/") },
        region: { startLine: s, endLine: e },
      },
    };
  });

  results.push({
    ruleId: "duplicate-code",
    level: "warning",
    message: {
      text: `JSInspect match ${m.id ?? idx + 1} across ${instances.length} locations${m.reason ? `: ${m.reason}` : ""}`,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: primary.path.replace(/\\/g, "/") },
          region,
        },
      },
    ],
    relatedLocations,
  });
}

const sarif = {
  $schema: "https://json.schemastore.org/sarif-2.1.0.json",
  version: "2.1.0",
  runs: [
    {
      tool: {
        driver: {
          name: "JSInspect",
          rules: [
            {
              id: "duplicate-code",
              name: "duplicate-code",
              shortDescription: { text: "Duplicate/near-miss code detected" },
            },
          ],
        },
      },
      results,
    },
  ],
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(sarif, null, 2));
console.log(`Wrote SARIF: ${outPath} (${results.length} results)`);



