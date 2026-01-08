// scripts/maintenance/generate-mock-json.ts
// Node-only: Generate public/__mockdb__/*.json from db/*.csv for Edge-safe mock data.
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const root = process.cwd();
  const dbDir = path.resolve(root, 'db');
  const outDir = path.resolve(root, 'public', '__mockdb__');
  const files = ['companies.csv', 'projects.csv', 'addresses.csv'];

  await fs.mkdir(outDir, { recursive: true });

  for (const csvName of files) {
    const csvPath = path.join(dbDir, csvName);
    try {
      const csv = await fs.readFile(csvPath, 'utf8');
      const rows = parseCsv(csv);
      const jsonName = csvName.replace(/\.csv$/i, '.json');
      const outPath = path.join(outDir, jsonName);
      await fs.writeFile(outPath, JSON.stringify(rows, null, 2) + '\n', 'utf8');
      console.log(`[mockdb] wrote ${path.relative(root, outPath)} (${rows.length} rows)`);
    } catch (err) {
      console.warn(`[mockdb] skip ${csvName}: ${(err as Error).message}`);
    }
  }
}

function parseCsv(text: string): Array<Record<string, string | number | boolean | null>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0] || '');
  const out: Array<Record<string, string | number | boolean | null>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i] || '');
    const row: Record<string, string | number | boolean | null> = {};
    for (let j = 0; j < header.length; j++) {
      const key = header[j] ?? `col_${j}`;
      const raw = cols[j] ?? '';
      row[key] = coerceValue(raw);
    }
    out.push(row);
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV splitting supporting quoted fields with commas and escaped quotes
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        result.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function coerceValue(v: string): string | number | boolean | null {
  if (v === '') return null;
  const low = v.toLowerCase();
  if (low === 'true' || low === 'false') return low === 'true';
  if (low === 'nan' || low === 'null') return null;
  const n = Number(v);
  if (!Number.isNaN(n) && /^-?\d+(?:\.\d+)?$/.test(v)) return n;
  return v;
}

main().catch((err) => {
  console.error('[mockdb] failed:', err);
  process.exitCode = 1;
});



