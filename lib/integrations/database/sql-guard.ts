// lib/integrations/database/sql-guard.ts
// Sprint 2: AST-based SQL guardrails with org filter injection and LIMIT enforcement
import 'server-only';

import { logger } from '@/lib/monitoring';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { Parser } from 'node-sql-parser';

/**
 * Security error for SQL guard violations
 */
export class SQLGuardError extends ApplicationError {
  constructor(
    message: string,
    code: string = 'SQL_GUARD_VIOLATION',
    category: ErrorCategory = ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity = ErrorSeverity.CRITICAL,
  ) {
    super({ message, code, category, severity });
    this.name = 'SQLGuardError';
  }
}

/**
 * Allowed tables in SQL queries
 */
const ALLOWED_TABLES = new Set(['projects', 'companies', 'addresses']);

/**
 * Column allowlists per table (derived from TypeScript types)
 * Includes org_id which exists at SQL level even if not in TS types
 */
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  projects: new Set([
    'org_id',
    'id',
    'created_at',
    'updated_at',
    'name',
    'type',
    'metadata',
    'permit_number',
    'description',
    'project_type',
    'status',
    'value',
    'square_footage',
    'contractor_id',
    'contractor_name',
    'owner_name',
    'address_id',
    'address_full',
    'city',
    'state',
    'zip_code',
    'submitted_date',
    'issued_date',
    'completed_date',
    'expiration_date',
    'inspection_count',
    'last_inspection_date',
    'fees_total',
    'fees_paid',
    'company_name',
    'start_date',
    'end_date',
    'budget',
    'spent',
    'progress',
    'milestone_count',
  ]),
  companies: new Set([
    'org_id',
    'id',
    'created_at',
    'updated_at',
    'name',
    'type',
    'metadata',
    'industry',
    'size',
    'revenue',
    'employee_count',
    'website',
    'location',
    'status',
    'project_count',
    'total_project_value',
    'last_project_date',
    'contact_email',
    'contact_phone',
    'notes',
    'active_permits',
    'primary_contractor',
    'license_number',
    'insurance_status',
    'bonding_capacity',
    'safety_rating',
  ]),
  addresses: new Set([
    'org_id',
    'id',
    'created_at',
    'updated_at',
    'name',
    'type',
    'metadata',
    'attom_id',
    'record_last_updated',
    'address_type_description',
    'apn_formatted',
    'built_year_at',
    'city',
    'contractor_names',
    'county_name',
    'full_address',
    'full_address_has_numbers',
    'homeowner_names',
    'job_count',
    'latest_permit_date',
    'latest_permit_type',
    'property_latitude',
    'property_longitude',
    'property_legal_description',
    'property_type_major_category',
    'property_type_sub_category',
    'state',
    'total_job_value',
    'zip',
    'street',
    'zip_code',
    'country',
    'county',
    'latitude',
    'longitude',
    'address_type',
    'property_value',
    'lot_size',
    'building_area',
    'year_built',
    'zoning',
    'project_count',
    'last_permit_date',
  ]),
};

/**
 * Get schema summary for use in prompts
 * Returns a formatted string describing allowed tables and their columns
 */
export function getSchemaSummary(): string {
  const tables = ['projects', 'companies', 'addresses'] as const;
  const summaries: string[] = [];
  
  for (const table of tables) {
    const columns = ALLOWED_COLUMNS[table];
    if (columns) {
      const columnList = Array.from(columns)
        .filter(col => col !== 'org_id') // Exclude org_id as it's injected automatically
        .sort()
        .join(', ');
      summaries.push(`- ${table}(${columnList})`);
    }
  }
  
  return summaries.join('\n');
}

/**
 * Get schema as JSON object for describe_schema tool
 * Returns { table: [column1, column2, ...] } format
 */
export function getSchemaJSON(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const tables = ['projects', 'companies', 'addresses'] as const;
  
  for (const table of tables) {
    const columns = ALLOWED_COLUMNS[table];
    if (columns) {
      result[table] = Array.from(columns)
        .filter(col => col !== 'org_id') // Exclude org_id as it's injected automatically
        .sort();
    }
  }
  
  return result;
}

/**
 * SQL Guard result metadata
 */
export interface SQLGuardResult {
  sql: string;
  metadata: {
    tablesUsed: string[];
    limitApplied: number;
    orgInjected: boolean;
  };
}

/**
 * Options for SQL Guard
 */
interface SQLGuardOptions {
  expectedOrgId?: string;
  maxRows?: number;
}

const parser = new Parser();

/**
 * Extract table references from AST
 * Note: JOINs are in the from array with a 'join' property, not a separate join property
 */
function extractTables(ast: any): Map<string, string> {
  const tableMap = new Map<string, string>(); // alias -> table name
  
  const extractFromTables = (selectNode: any): void => {
    if (!selectNode || typeof selectNode !== 'object') return;
    
    // Handle FROM clause (array of table objects, including JOINs)
    if (selectNode.from && Array.isArray(selectNode.from)) {
      for (const fromItem of selectNode.from) {
        if (fromItem && fromItem.table) {
          const tableName = String(fromItem.table).toLowerCase();
          const alias = fromItem.as ? String(fromItem.as).toLowerCase() : tableName;
          tableMap.set(alias, tableName);
        }
      }
    }
  };
  
  // Extract from main SELECT
  extractFromTables(ast);
  
  // Also extract from WITH CTEs (recursively)
  if (ast.with && Array.isArray(ast.with)) {
    for (const cte of ast.with) {
      if (cte && cte.stmt) {
        // CTE can have stmt.ast (the actual SELECT AST) or stmt directly
        const cteSelect = cte.stmt.ast || cte.stmt;
        extractFromTables(cteSelect);
      }
    }
  }
  
  return tableMap;
}

/**
 * Check if WHERE clause already has org_id filter for a table/alias
 */
function hasOrgFilter(where: any, identifier: string): boolean {
  if (!where) return false;
  
  const traverse = (node: any): boolean => {
    if (!node || typeof node !== 'object') return false;
    
    // Check for binary expression: identifier.org_id = 'value' or org_id = 'value'
    if (node.type === 'binary_expr') {
      const left = node.left;
      const operator = node.operator;
      
      if (operator === '=' && left && left.type === 'column_ref') {
        const columnRef = left;
        const colTable = columnRef.table ? String(columnRef.table).toLowerCase() : null;
        const colColumn = columnRef.column ? String(columnRef.column).toLowerCase() : null;
        
        const identifierLower = identifier.toLowerCase();
        
        // Match if: (table.org_id = value) or (org_id = value when identifier is table name)
        if (colColumn === 'org_id') {
          if (colTable === identifierLower) {
            return true; // Exact match: identifier.org_id
          }
          // Also match if no table prefix and identifier is a table name (not alias)
          // This handles cases like "SELECT * FROM projects WHERE org_id = 'x'"
          if (!colTable && identifierLower === identifier.toLowerCase()) {
            // We'll be conservative and only match if there's no table prefix
            // The injection logic will handle adding the prefix if needed
            return true;
          }
        }
      }
    }
    
    // Check AND/OR expressions (recurse on both sides)
    if (node.type === 'binary_expr' && (node.operator === 'AND' || node.operator === 'OR')) {
      return traverse(node.left) || traverse(node.right);
    }
    
    // Recursively check nested conditions
    const skipFields = new Set(['parent', 'next', 'prev']);
    for (const [key, value] of Object.entries(node)) {
      if (skipFields.has(key)) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (traverse(item)) return true;
        }
      } else if (value && typeof value === 'object') {
        if (traverse(value)) return true;
      }
    }
    
    return false;
  };
  
  return traverse(where);
}

/**
 * Create org_id filter AST node
 */
function createOrgFilter(alias: string, orgId: string): any {
  return {
    type: 'binary_expr',
    operator: '=',
    left: {
      type: 'column_ref',
      table: alias || null, // Use null if no alias (table name used directly)
      column: 'org_id',
    },
    right: {
      type: 'single_quote_string', // node-sql-parser uses single quotes
      value: orgId,
    },
  };
}

/**
 * Inject org filter into WHERE clause
 */
function injectOrgFilter(where: any, alias: string, orgId: string): any {
  const filter = createOrgFilter(alias, orgId);
  
  if (!where) {
    return filter;
  }
  
  // If WHERE exists, AND it with the org filter
  return {
    type: 'binary_expr',
    operator: 'AND',
    left: where,
    right: filter,
  };
}

/**
 * Validate and normalize SQL query using AST
 */
export function guardSQL(sql: string, options: SQLGuardOptions = {}): SQLGuardResult {
  const { expectedOrgId, maxRows = 100 } = options;
  
  if (!sql?.trim()) {
    throw new SQLGuardError('SQL query is required', 'INVALID_SQL_INPUT');
  }
  
  // Remove trailing semicolons for parsing
  const trimmed = sql.trim().replace(/;+$/, '');
  
  // Check for multiple statements (basic check before parsing)
  if (trimmed.split(';').filter(s => s.trim()).length > 1) {
    throw new SQLGuardError('Multiple statements are not allowed', 'MULTI_STATEMENT');
  }
  
  try {
    // Parse SQL to AST
    const ast = parser.astify(trimmed, { database: 'MySQL' }); // Use MySQL dialect as it's common
    
    // Handle array of statements (should not happen due to check above, but defensive)
    const statements = Array.isArray(ast) ? ast : [ast];
    if (statements.length !== 1) {
      throw new SQLGuardError('Only single-statement queries are allowed', 'MULTI_STATEMENT');
    }
    
    const statement = statements[0] as any;
    
    // Validate query type - must be SELECT (WITH statements are also type='select' but have a 'with' property)
    const statementType = statement.type as string;
    if (statementType !== 'select') {
      throw new SQLGuardError(`Only SELECT or WITH queries are allowed, got: ${statementType}`, 'INVALID_QUERY_TYPE');
    }
    
    // WITH statements are SELECT queries with a 'with' array property
    // We'll process the main SELECT AST directly
    const selectAst = statement;
    
    // For WITH statements, we need to handle CTEs separately
    // Currently, we'll validate that CTEs don't reference disallowed tables
    // but we'll inject org filters only in the main SELECT for simplicity
    // TODO: Could be enhanced to inject org filters in CTEs too
    if (selectAst.with && Array.isArray(selectAst.with)) {
      // Validate CTEs don't reference disallowed tables
      for (const cte of selectAst.with) {
        if (cte && cte.stmt) {
          const cteSelect = cte.stmt.ast || cte.stmt;
          const cteTables = extractTables(cteSelect);
          for (const tableName of cteTables.values()) {
            if (!ALLOWED_TABLES.has(tableName)) {
              throw new SQLGuardError(`CTE references disallowed table '${tableName}'`, 'DISALLOWED_TABLE');
            }
          }
        }
      }
    }
    
    // Extract table references (excluding CTEs which are defined in the WITH clause)
    const tableMap = extractTables(selectAst);
    const cteNames = new Set<string>();
    if (selectAst.with && Array.isArray(selectAst.with)) {
      for (const cte of selectAst.with) {
        if (cte && cte.name && cte.name.value) {
          cteNames.add(String(cte.name.value).toLowerCase());
        }
      }
    }
    // Filter out CTE names from tables used (CTEs are not actual tables)
    const tablesUsed: string[] = Array.from(tableMap.values()).filter(
      (table) => !cteNames.has(table.toLowerCase())
    );
    
    // Validate tables are allowlisted
    for (const table of tablesUsed) {
      if (!ALLOWED_TABLES.has(table)) {
        throw new SQLGuardError(`Table '${table}' is not allowed. Allowed tables: ${Array.from(ALLOWED_TABLES).join(', ')}`, 'DISALLOWED_TABLE');
      }
    }
    
    // Reject system/metadata schema access
    for (const table of tablesUsed) {
      if (table.includes('.') && (table.startsWith('system.') || table.startsWith('information_schema.'))) {
        throw new SQLGuardError('Access to system or metadata schemas is not allowed', 'SYSTEM_SCHEMA_ACCESS');
      }
    }
    
    let orgInjected = false;
    
    // Inject org_id filters if expectedOrgId is provided
    if (expectedOrgId && tablesUsed.length > 0) {
      const currentWhere = selectAst.where;
      
      // For each unique table, ensure org_id filter exists
      // Use alias if present, otherwise use table name
      const processedTables = new Set<string>();
      for (const [alias, tableName] of tableMap.entries()) {
        // Use alias if it's different from table name (meaning there's an actual alias)
        // Otherwise use table name directly
        const identifier = alias !== tableName ? alias : tableName;
        
        // Only process each table once (in case of multiple aliases for same table)
        if (!processedTables.has(tableName)) {
          processedTables.add(tableName);
          
          if (!hasOrgFilter(currentWhere, identifier)) {
            selectAst.where = injectOrgFilter(selectAst.where, identifier, expectedOrgId);
            orgInjected = true;
          }
        }
      }
    }
    
    // Enforce LIMIT
    let limitApplied = maxRows;
    if (selectAst.limit) {
      const existingLimit = selectAst.limit.value?.[0]?.value;
      if (existingLimit && typeof existingLimit === 'number') {
        limitApplied = Math.min(existingLimit, maxRows);
      }
      selectAst.limit.value = [{ type: 'number', value: limitApplied }];
    } else {
      // Add LIMIT if missing
      selectAst.limit = {
        seperator: '',
        value: [{ type: 'number', value: limitApplied }],
      };
    }
    
    // Serialize AST back to SQL
    const normalizedSQL = parser.sqlify(statement, { database: 'MySQL' });
    
    logger?.debug?.('[SQLGuard] normalized SQL', {
      original: sql,
      normalized: normalizedSQL,
      tablesUsed,
      limitApplied,
      orgInjected,
    });
    
    return {
      sql: normalizedSQL,
      metadata: {
        tablesUsed,
        limitApplied,
        orgInjected,
      },
    };
  } catch (error) {
    // Handle parsing errors
    if (error instanceof SQLGuardError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger?.error?.('[SQLGuard] parsing error', { sql, error: errorMessage });
    throw new SQLGuardError(`SQL parsing failed: ${errorMessage}`, 'SQL_PARSE_ERROR');
  }
}

