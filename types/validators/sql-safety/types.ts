/* types/shared/validation/sql-safety/types.ts – consolidated 2025-07-22
 * Comprehensive SQL-safety branded types **and** compile-time builder helpers.
 *
 * Merged from the former `types/database/sql-safety/types.ts` to centralise
 * ClickHouse-related safety types under `types/shared`.
 *
 * NOTE: Although this file contains functions/classes, they are **types-only
 * facades** – using `declare` where appropriate so no runtime code leaks into
 * compiled output when this file is imported purely for types. Where runtime
 * helpers are needed, import from `@/lib/integrations/clickhouse` instead.
 */

/* ------------------------------------------------------------------ */
/* 🏷️ Branded SQL Types (Removed - unused exports)                   */
/* ------------------------------------------------------------------ */

/* Note: Branded SQL types (SqlString, SafeSqlString, etc.) removed as unused */

/* ------------------------------------------------------------------ */
/* 🔍 Compile-time Guard Declarations (stubbed)                      */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* 🛠️ Builder Helper Types                                          */
/* ------------------------------------------------------------------ */

export type AllowedTableName =
  | 'projects'
  | 'companies'
  | 'addresses'
  | 'users'
  | 'organizations'
  | 'events';

export type AllowedColumn = string;

export interface WhereCondition {
  readonly column: AllowedColumn;
  readonly operator:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'LIKE'
    | 'IN'
    | 'IS NULL'
    | 'IS NOT NULL';
  readonly value?: string | number | boolean | null | (string | number)[];
}


/* Note: SafeSqlOperation type alias removed as unused */

/* ------------------------------------------------------------------ */
/* 🏗️ Safe SQL Builder (Runtime Only - Interface Removed)            */
/* ------------------------------------------------------------------ */

/* Note: SafeSqlBuilder interface removed as unused. Runtime implementation exists in lib/integrations/database/builder.ts */

/* ------------------------------------------------------------------ */
/* 🎯 Factory Helpers (types-only stubs)                             */
/* ------------------------------------------------------------------ */

export interface SafeSqlBuilder {
  select(columns: AllowedColumn[] | ['*']): this;
  from(table: AllowedTableName): this;
  where(conditions: WhereCondition[]): this;
  orderBy(clauses: { column: AllowedColumn; direction: 'ASC' | 'DESC' }[]): this;
  limit(count: number): this;
  offset(count: number): this;
  build(): string;
  validate(): boolean;
}

export declare function createSafeSqlBuilder(): SafeSqlBuilder;

