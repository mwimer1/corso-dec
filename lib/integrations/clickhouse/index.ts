// Canonical server-side surface for ClickHouse
export { queryEntityCount, queryEntityData } from './entity-query.server';

export { clickhouse, clickhouseQuery, createClickhouseClient } from './server';
export type { ClickHouseClient } from '@clickhouse/client';

// Ensure this barrel is server-safe for Node-only consumers



