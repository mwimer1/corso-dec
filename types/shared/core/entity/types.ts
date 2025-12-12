/**
 * Shared dashboard-entity primitives
 * ----------------------------------
 * Centralised generic row and entity-page data-loader params used across
 * dashboard features (analytics, chat, widgets, etc.).
 *
 * NOTE: All domain-specific folders should import these types rather than
 * redefining their own to avoid drift.
 */

/** A single row returned from any entity table/view */
export type Row = Record<string, unknown>;

/**
 * Parameters accepted by the entity-page data loader.
 */
export interface GetEntityPageDataParams {
  /** Name of the table or view (e.g. "projects", "companies") */
  entity: string;
}

