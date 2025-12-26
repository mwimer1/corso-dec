// lib/services/entity/search-fields.ts

/**
 * @module lib/services/entity/search-fields
 * @description Entity-specific searchable field configurations for global quick search
 * 
 * This module defines which database fields are searchable for each entity type.
 * Fields are whitelisted for security - only fields listed here can be searched.
 * 
 * @security Field names are hardcoded whitelists - no user input is used to construct field names.
 */

import type { EntityKind } from './contracts';

/**
 * Searchable fields configuration per entity type.
 * 
 * Each entity maps to an array of database field names that should be searched
 * when a user performs a global search query.
 * 
 * Fields are searched using SQL LIKE with wildcards: `field LIKE '%search%'`
 * Multiple fields are combined with OR: `(field1 LIKE ... OR field2 LIKE ...)`
 * 
 * @example
 * ```typescript
 * // Projects: search description and permit ID
 * ENTITY_SEARCH_FIELDS.projects // ['description', 'building_permit_id']
 * 
 * // Companies: search name and description
 * ENTITY_SEARCH_FIELDS.companies // ['company_name', 'company_description']
 * 
 * // Addresses: search address components
 * ENTITY_SEARCH_FIELDS.addresses // ['full_address', 'city', 'state', 'zipcode']
 * ```
 */
export const ENTITY_SEARCH_FIELDS: Readonly<Record<EntityKind, readonly string[]>> = {
  /**
   * Projects searchable fields:
   * - description: Project description text
   * - building_permit_id: Permit identifier (searchable for quick lookup)
   * - city: City name (useful for location-based search)
   */
  projects: ['description', 'building_permit_id', 'city'] as const,

  /**
   * Companies searchable fields:
   * - company_name: Company name
   * - company_description: Company description text
   */
  companies: ['company_name', 'company_description'] as const,

  /**
   * Addresses searchable fields:
   * - full_address: Complete address string
   * - city: City name
   * - state: State abbreviation or name
   * - zipcode: ZIP/postal code
   */
  addresses: ['full_address', 'city', 'state', 'zipcode'] as const,
} as const;

/**
 * Get searchable fields for an entity type.
 * 
 * @param entity - Entity type (projects, companies, addresses)
 * @returns Array of searchable field names, or empty array if entity not found
 * 
 * @example
 * ```typescript
 * const fields = getSearchFields('projects');
 * // Returns: ['description', 'building_permit_id', 'city']
 * 
 * const fields = getSearchFields('unknown' as EntityKind);
 * // Returns: [] (safe fallback)
 * ```
 */
export function getSearchFields(entity: EntityKind): readonly string[] {
  return ENTITY_SEARCH_FIELDS[entity] ?? [];
}

/**
 * Check if an entity has searchable fields configured.
 * 
 * @param entity - Entity type
 * @returns true if entity has searchable fields, false otherwise
 */
export function hasSearchFields(entity: EntityKind): boolean {
  const fields = getSearchFields(entity);
  return fields.length > 0;
}

