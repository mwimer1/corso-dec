// lib/mocks/entity-data.server.ts
// Node-only JSON querying for mock entity data.
import { normalizeAddress, normalizeCompany } from '@/lib/mocks/normalize';
import { requireServerEnv } from '@/lib/server/env';
import { AddressRowSchema, CompanyRowSchema, ProjectRowSchema } from '@/lib/validators';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'server-only';
import { z } from 'zod';
import { adaptProjectsFile } from './mappers/projects.adapter';

const ProjectsFile = z.array(ProjectRowSchema);
const CompaniesFile = z.array(CompanyRowSchema);
const AddressesFile = z.array(AddressRowSchema);

export type QueryParams = {
  page: number;
  pageSize: number;
  sort: { column: string; direction: 'asc' | 'desc' };
  filters?: Array<{
    field: string;
    op: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool';
    value: unknown;
  }>;
  search?: string;
};

export type Filter = QueryParams['filters'] extends readonly (infer T)[] ? T : never;
export type Sort = QueryParams['sort'];
export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

type Entity = 'projects' | 'companies' | 'addresses';

export async function queryEntityFromCsv(
  entity: Entity,
  params: QueryParams,
): Promise<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
  const { CORSO_USE_MOCK_DB } = requireServerEnv('CORSO_USE_MOCK_DB');

  // If mock flag is not 'true', this shouldn't be called - delegate to real data source
  if (CORSO_USE_MOCK_DB !== 'true') {
    throw new Error('Mock data source called but CORSO_USE_MOCK_DB is not "true"');
  }

  const file = path.resolve(process.cwd(), 'public', '__mockdb__', `${entity}.json`);
  const rows = await readJson(file);

  // If source is projects, adapt noisy vendor rows into canonical shape before validating
  const adaptedRows = entity === 'projects' ? adaptProjectsFile(rows) : rows;
  // Validate JSON data with Zod schema (for projects the adapter already returns canonical validated rows)
  const validatedRows = entity === 'projects' ? adaptedRows : validateEntityFile(entity, adaptedRows as Record<string, unknown>[]);
  const normalized = validatedRows.map((row: Record<string, unknown>) => normalizeEntityRow(entity, row));

  const filtered = applyFilters(normalized, params.filters ?? []);
  const searched = applySearch(filtered, params.search);
  const sorted = sortRows(searched, params.sort);

  const total = sorted.length;
  const start = Math.max(0, params.page * params.pageSize);
  const end = Math.min(total, start + params.pageSize);
  const pageSlice = sorted.slice(start, end);

  return { data: pageSlice, total, page: params.page, pageSize: params.pageSize };
}

async function readJson(filePath: string): Promise<Record<string, unknown>[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(content) as Record<string, unknown>[];
  return data;
}

function validateEntityFile(entity: Entity, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  switch (entity) {
    case 'projects':
      return ProjectsFile.parse(rows);
    case 'companies':
      return CompaniesFile.parse(rows);
    case 'addresses':
      return AddressesFile.parse(rows);
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}

function normalizeEntityRow(entity: Entity, row: Record<string, unknown>): Record<string, unknown> {
  switch (entity) {
    case 'projects':
      // Projects are already normalized by adaptProjectsFile, return as-is
      return row;
    case 'companies':
      return normalizeCompany(row);
    case 'addresses':
      return normalizeAddress(row);
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}



function applySearch(rows: Record<string, unknown>[], search?: string): Record<string, unknown>[] {
  if (!search || search.trim() === '') return rows;
  const q = search.toLowerCase();
  return rows.filter((row) =>
    Object.values(row).some((v) => typeof v === 'string' && v.toLowerCase().includes(q)),
  );
}

function applyFilters(
  rows: Record<string, unknown>[],
  filters: QueryParams['filters'],
): Record<string, unknown>[] {
  if (!filters || filters.length === 0) return rows;
  return rows.filter((row) => filters.every((f) => evaluateFilter(row, f)));
}

function evaluateFilter(
  row: Record<string, unknown>,
  f: NonNullable<QueryParams['filters']>[number],
): boolean {
  const value = row[f.field];
  switch (f.op) {
    case 'eq':
      return normalizeComparable(value) === normalizeComparable(f.value);
    case 'contains':
      return typeof value === 'string' && typeof f.value === 'string'
        ? value.toLowerCase().includes(f.value.toLowerCase())
        : false;
    case 'gt':
    case 'lt':
    case 'gte':
    case 'lte': {
      const [a, b] = [toOrderable(value), toOrderable(f.value)];
      if (a == null || b == null) return false;
      if (f.op === 'gt') return a > b;
      if (f.op === 'lt') return a < b;
      if (f.op === 'gte') return a >= b;
      return a <= b;
    }
    case 'in': {
      const arr = Array.isArray(f.value) ? f.value : [];
      return arr.map(normalizeComparable).includes(normalizeComparable(value));
    }
    case 'between': {
      const arr = Array.isArray(f.value) ? f.value : [];
      const min = toOrderable(arr[0]);
      const max = toOrderable(arr[1]);
      const v = toOrderable(value);
      if (v == null || min == null || max == null) return false;
      return v >= min && v <= max;
    }
    case 'bool':
      return Boolean(value) === Boolean(f.value);
    default:
      return true;
  }
}

function normalizeComparable(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === 'string') return v.toLowerCase();
  return v;
}

function parseDate(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  // Try ISO or common US dates (MM/DD/YYYY)
  const iso = Date.parse(v);
  if (!Number.isNaN(iso)) return iso;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const month = Number(m[1]) - 1;
    const day = Number(m[2]);
    const year = Number(m[3]);
    return new Date(year, month, day).getTime();
  }
  return null;
}

function toOrderable(v: unknown): number | string | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const asDate = parseDate(v);
  if (asDate != null) return asDate;
  if (typeof v === 'string') return v;
  return null;
}

function sortRows(
  rows: Record<string, unknown>[],
  sort: { column: string; direction: 'asc' | 'desc' },
): Record<string, unknown>[] {
  const { column, direction } = sort;
  if (!column) return rows;
  const dir = direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = toOrderable(a[column]);
    const bv = toOrderable(b[column]);
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulls last
    if (bv == null) return -1;
    if (av === bv) return 0;
    return av > bv ? dir : -dir;
  });
}



