// server-capable action utilities (no 'use server' directive to allow dynamic import)

// getEnv already imported below
import type { BaseRow } from '@/types/dashboard';
import type { EntityFetchParams, EntityFetchResult, EntityKind } from './contracts';

import { getEntityPage } from '@/lib/api';
import { queryEntityCount, queryEntityData } from '@/lib/integrations/clickhouse';
import { getEnv } from '@/lib/server/env';
import { publicEnv } from '@/lib/shared/config/client';
import { loadGridConfig } from './config';

export async function fetchEntityData<T extends BaseRow = BaseRow>(
  slug: string,
  _id: string | undefined,
  params: EntityFetchParams,
): Promise<EntityFetchResult<T>> {
  // Mock JSON fallback during development
  try {
    const useMock = getEnv().CORSO_USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test';
    const entity = slug as 'projects' | 'companies' | 'addresses';
    if (useMock && (entity === 'projects' || entity === 'companies' || entity === 'addresses')) {
      const base = new URL(publicEnv.NEXT_PUBLIC_SITE_URL || publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      const result = await getEntityPage(
        {
          entity,
          page: params.page,
          pageSize: params.pageSize,
          sort: params.sort,
          ...(params.search ? { search: params.search } : {}),
          ...(params.filters ? { filters: params.filters } : {}),
        },
        { baseUrl: base },
      );
      return result as unknown as { data: T[]; total: number; page: number; pageSize: number };
    }
  } catch {
    // If mock path fails, fall through to real DB query
  }

  const entity = slug as EntityKind;

  // Try mock path first (development); otherwise run real DB queries
  const useMock = getEnv().CORSO_USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test';
  if (useMock && (entity === 'projects' || entity === 'companies' || entity === 'addresses')) {
    try {
      const base = new URL(publicEnv.NEXT_PUBLIC_SITE_URL || publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      const result = await getEntityPage(
        {
          entity,
          page: params.page,
          pageSize: params.pageSize,
          sort: params.sort,
          ...(params.search ? { search: params.search } : {}),
          ...(params.filters ? { filters: params.filters } : {}),
        },
        { baseUrl: base },
      );
      return result as unknown as { data: T[]; total: number; page: number; pageSize: number };
    } catch (error) {
      // If mock path failed, fall through to attempt real DB query
    }
  }

  // Real database query path — build query via integration and ensure errors propagate
  try {
    // Load grid metadata to know table/PK
    const gridConfig = await loadGridConfig(entity);
    const tableName = gridConfig.tableName ?? entity;
    const defaultSort = gridConfig.primaryKey ?? 'id';

    // Build SQL with WHERE, ORDER BY, LIMIT/OFFSET
    const whereConditions: string[] = [];
    const paramsObj: Record<string, unknown> = {};
    let paramCounter = 1;

    // Build WHERE conditions from filters
    if (params.filters && params.filters.length > 0) {
      for (const filter of params.filters) {
        const paramKey = `p${paramCounter++}`;

        switch (filter.op) {
          case 'eq': {
            whereConditions.push(`${filter.field} = {${paramKey}:String}`);
            paramsObj[paramKey] = String(filter.value);
            break;
          }
          case 'contains': {
            whereConditions.push(`position(${filter.field}, {${paramKey}:String}) > 0`);
            paramsObj[paramKey] = String(filter.value);
            break;
          }
          case 'gt': {
            whereConditions.push(`${filter.field} > {${paramKey}:Float64}`);
            paramsObj[paramKey] = Number(filter.value);
            break;
          }
          case 'gte': {
            whereConditions.push(`${filter.field} >= {${paramKey}:Float64}`);
            paramsObj[paramKey] = Number(filter.value);
            break;
          }
          case 'lt': {
            whereConditions.push(`${filter.field} < {${paramKey}:Float64}`);
            paramsObj[paramKey] = Number(filter.value);
            break;
          }
          case 'lte': {
            whereConditions.push(`${filter.field} <= {${paramKey}:Float64}`);
            paramsObj[paramKey] = Number(filter.value);
            break;
          }
          case 'in': {
            const values = Array.isArray(filter.value) ? filter.value : [filter.value];
            whereConditions.push(`${filter.field} IN {${paramKey}:Array(String)}`);
            paramsObj[paramKey] = values.map(String);
            break;
          }
          case 'bool': {
            whereConditions.push(`${filter.field} = {${paramKey}:UInt8}`);
            paramsObj[paramKey] = filter.value ? 1 : 0;
            break;
          }
          default: {
            whereConditions.push(`${filter.field} = {${paramKey}:String}`);
            paramsObj[paramKey] = String(filter.value);
          }
        }
      }
    }

    // Build search condition
    if (params.search && params.search.trim()) {
      const searchParamKey = `p${paramCounter++}`;
      whereConditions.push(`(name LIKE {${searchParamKey}:String} OR description LIKE {${searchParamKey}:String})`);
      paramsObj[searchParamKey] = `%${params.search}%`;
    }

    // Build ORDER BY clause
    const orderBy = params.sort && params.sort.column
      ? `${params.sort.column} ${params.sort.direction === 'desc' ? 'DESC' : 'ASC'}`
      : `${defaultSort} ASC`;

    // Build final SQL with pagination
    const offset = params.page * params.pageSize;
    let sql = `SELECT * FROM ${tableName}`;
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    sql += ` ORDER BY ${orderBy}`;
    sql += ` LIMIT ${params.pageSize} OFFSET ${offset}`;

    // Execute data query
    const data = await queryEntityData(sql, paramsObj) as T[];

    // Build count query (same filters, no pagination)
    let countSql = `SELECT COUNT(*) AS count FROM ${tableName}`;
    if (whereConditions.length > 0) {
      countSql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    let total: number;
    try {
      total = await queryEntityCount(countSql, paramsObj);
    } catch {
      // Fallback to data length if count fails
      total = Array.isArray(data) ? data.length : 0;
    }

    return { data, total, page: params.page, pageSize: params.pageSize };
  } catch (err) {
    // Surface structured error for callers/tests
    throw new Error('Failed to fetch entity data');
  }
}


