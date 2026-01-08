/**
 * Server-only ClickHouse integration for entity queries.
 * Provides a typed, secure interface for querying entity data.
 */

import 'server-only';
import { clickhouseQuery } from './client';

/**
 * Query entity data from ClickHouse.
 * Server-only wrapper that delegates to the ClickHouse runner.
 */
export async function queryEntityData(sql: string, params?: Record<string, unknown>): Promise<unknown[]> {
  const rows = await clickhouseQuery(sql, params);
  return rows ?? [];
}

/**
 * Run a count query and return numeric total.
 * Attempts common property names and falls back to 0.
 */
export async function queryEntityCount(sql: string, params?: Record<string, unknown>): Promise<number> {
  const rows = await clickhouseQuery(sql, params);
  const first = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any) : null;
  if (!first) return 0;
  const val = first.count ?? first.cnt ?? first.total ?? Object.values(first)[0];
  const num = Number(val ?? 0);
  return Number.isFinite(num) ? num : 0;
}

