/**
 * Shared dashboard-entity primitives
 * ----------------------------------
 * Centralised generic row type used across dashboard features
 * (analytics, chat, widgets, etc.).
 *
 * NOTE: All domain-specific folders should import these types rather than
 * redefining their own to avoid drift.
 */

/** A single row returned from any entity table/view */
export type Row = Record<string, unknown>;

