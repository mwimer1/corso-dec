// scripts/maintenance/generate-mock-json.ts
// Node-only: Generate public/__mockdb__/*.json from db/*.csv for Edge-safe mock data.
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Field name mappings from CSV headers to canonical field names expected by the UI.
 * Maps are applied per entity type to normalize field names.
 */
function getFieldMappings(csvName: string): Record<string, string> {
  const baseMappings: Record<string, string> = {};
  
  if (csvName === 'projects.csv') {
    return {
      'id_permit_atm': 'building_permit_id',
      'date_effective': 'effective_date',
      'propery_type_major_category': 'property_type_major_category', // Fix typo
      'latitude': 'property_latitude',
      'longitude': 'property_longitude',
      'full_mailing_address': 'full_address',
      'id_property_atm': 'attom_id',
      'company_name': 'contractor_names',
      'property_owner': 'homeowner_names',
    };
  }
  
  // Add mappings for companies.csv and addresses.csv as needed
  // For now, return empty object if no specific mappings are needed
  if (csvName === 'companies.csv' || csvName === 'addresses.csv') {
    // Add entity-specific mappings here if needed
    // Example: 'id_contractor': 'contractor_id'
    return {};
  }
  
  return baseMappings;
}

/**
 * Apply field name mappings to a row object
 */
function applyFieldMappings(row: Record<string, string | number | boolean | null>, mappings: Record<string, string>): void {
  for (const [oldKey, newKey] of Object.entries(mappings)) {
    if (oldKey in row) {
      const value = row[oldKey];
      if (value !== undefined) {
        row[newKey] = value;
      }
      delete row[oldKey];
    }
  }
}

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
      const rows = parseCsv(csv, csvName);
      const jsonName = csvName.replace(/\.csv$/i, '.json');
      const outPath = path.join(outDir, jsonName);
      await fs.writeFile(outPath, JSON.stringify(rows, null, 2) + '\n', 'utf8');
      console.log(`[mockdb] wrote ${path.relative(root, outPath)} (${rows.length} rows)`);
    } catch (err) {
      console.warn(`[mockdb] skip ${csvName}: ${(err as Error).message}`);
    }
  }
}

function parseCsv(text: string, csvName: string): Array<Record<string, string | number | boolean | null>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0] || '');
  const mappings = getFieldMappings(csvName);
  const out: Array<Record<string, string | number | boolean | null>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i] || '');
    const row: Record<string, string | number | boolean | null> = {};
    for (let j = 0; j < header.length; j++) {
      const key = header[j] ?? `col_${j}`;
      const raw = cols[j] ?? '';
      row[key] = coerceValue(raw);
    }
    // Apply field name mappings to normalize CSV headers to canonical names
    applyFieldMappings(row, mappings);
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



