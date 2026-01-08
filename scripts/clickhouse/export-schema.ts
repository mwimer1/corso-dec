#!/usr/bin/env tsx
/**
 * ClickHouse Schema Export Script
 * 
 * Exports ClickHouse database schema to DDL files for version control.
 * 
 * Usage:
 *   pnpm clickhouse:export-schema
 * 
 * Environment Variables Required:
 *   - CLICKHOUSE_URL
 *   - CLICKHOUSE_DATABASE
 *   - CLICKHOUSE_READONLY_USER
 *   - CLICKHOUSE_PASSWORD
 */

import { createClickhouseClient } from '@/lib/integrations/clickhouse/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface TableInfo {
  database: string;
  name: string;
  engine: string;
  create_table_query: string;
}

async function exportSchema() {
  console.log('🔍 Connecting to ClickHouse...');

  // Use the integration layer which handles environment variables
  const client = createClickhouseClient();

  try {
    // Get database name from client config (we'll need to get it from env)
    // For now, we'll query all databases and filter
    console.log('📊 Fetching table definitions...');
    
    // Get current database from environment
    const { getEnv } = await import('@/lib/server/env');
    const env = getEnv();
    const database = env.CLICKHOUSE_DATABASE;

    const tablesResult = await client.query({
      query: `
        SELECT 
          database,
          name,
          engine,
          create_table_query
        FROM system.tables
        WHERE database = {database:String}
        AND engine LIKE '%MergeTree%'
        ORDER BY name
      `,
      query_params: {
        database,
      },
      format: 'JSONEachRow',
    });

    const tables = (await tablesResult.json()) as TableInfo[];

    if (tables.length === 0) {
      console.log('⚠️  No MergeTree tables found in database');
      return;
    }

    console.log(`✅ Found ${tables.length} table(s)`);

    // Generate schema.sql content
    const schemaContent = `-- ClickHouse Schema DDL
-- Generated: ${new Date().toISOString()}
-- Database: ${database}
-- Tables: ${tables.length}

${tables
  .map((table) => {
    // Clean up the CREATE TABLE query
    let ddl = table.create_table_query;
    // Remove database prefix if present
    ddl = ddl.replace(new RegExp(`\`?${table.database}\`?\\.`, 'g'), '');
    return `-- Table: ${table.name}\n-- Engine: ${table.engine}\n${ddl};\n`;
  })
  .join('\n')}
`;

    // Get indexes (if any)
    console.log('📇 Fetching index definitions...');
    let indexesContent = `-- ClickHouse Index Definitions
-- Generated: ${new Date().toISOString()}
-- Database: ${database}

`;

    try {
      const indexesResult = await client.query({
        query: `
          SELECT 
            table,
            name,
            type,
            expr
          FROM system.data_skipping_indices
          WHERE database = {database:String}
          ORDER BY table, name
        `,
        query_params: {
          database,
        },
        format: 'JSONEachRow',
      });

      const indexes = (await indexesResult.json()) as Array<{
        table: string;
        name: string;
        type: string;
        expr: string;
      }>;

      if (indexes.length > 0) {
        indexesContent += indexes
          .map(
            (idx) =>
              `-- Index: ${idx.name} on ${idx.table}\n-- Type: ${idx.type}\n-- Expression: ${idx.expr}\n`,
          )
          .join('\n');
      } else {
        indexesContent += '-- No data skipping indexes found\n';
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch indexes:', error);
      indexesContent += '-- Index export failed\n';
    }

    // Ensure directory exists
    const ddlDir = join(process.cwd(), 'clickhouse', 'ddl');
    await mkdir(ddlDir, { recursive: true });

    // Write schema.sql
    const schemaPath = join(ddlDir, 'schema.sql');
    await writeFile(schemaPath, schemaContent, 'utf-8');
    console.log(`✅ Wrote schema to ${schemaPath}`);

    // Write indexes.sql
    const indexesPath = join(ddlDir, 'indexes.sql');
    await writeFile(indexesPath, indexesContent, 'utf-8');
    console.log(`✅ Wrote indexes to ${indexesPath}`);

    console.log('\n✨ Schema export complete!');
    console.log(`   Tables exported: ${tables.length}`);
    console.log(`   Files written:`);
    console.log(`   - ${schemaPath}`);
    console.log(`   - ${indexesPath}`);
  } catch (error) {
    console.error('❌ Failed to export schema:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportSchema().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { exportSchema };
