import { ENTITY_SEARCH_FIELDS, getSearchFields, hasSearchFields } from '@/lib/entities/search-fields';
import { describe, expect, it } from 'vitest';

describe('Entity Search Fields Configuration', () => {
  describe('ENTITY_SEARCH_FIELDS', () => {
    it('should have search fields configured for all entity types', () => {
      expect(ENTITY_SEARCH_FIELDS.projects).toBeDefined();
      expect(ENTITY_SEARCH_FIELDS.companies).toBeDefined();
      expect(ENTITY_SEARCH_FIELDS.addresses).toBeDefined();
    });

    it('should have correct fields for projects', () => {
      expect(ENTITY_SEARCH_FIELDS.projects).toEqual([
        'description',
        'building_permit_id',
        'city',
      ]);
    });

    it('should have correct fields for companies', () => {
      expect(ENTITY_SEARCH_FIELDS.companies).toEqual([
        'company_name',
        'company_description',
      ]);
    });

    it('should have correct fields for addresses', () => {
      expect(ENTITY_SEARCH_FIELDS.addresses).toEqual([
        'full_address',
        'city',
        'state',
        'zipcode',
      ]);
    });

    it('should not include hardcoded "name" or "description" fields that do not exist', () => {
      // Companies should use company_name, not name
      expect(ENTITY_SEARCH_FIELDS.companies).not.toContain('name');
      expect(ENTITY_SEARCH_FIELDS.companies).toContain('company_name');
      
      // Addresses should not have name or description
      expect(ENTITY_SEARCH_FIELDS.addresses).not.toContain('name');
      expect(ENTITY_SEARCH_FIELDS.addresses).not.toContain('description');
    });
  });

  describe('getSearchFields', () => {
    it('should return correct fields for projects', () => {
      const fields = getSearchFields('projects');
      expect(fields).toEqual(['description', 'building_permit_id', 'city']);
    });

    it('should return correct fields for companies', () => {
      const fields = getSearchFields('companies');
      expect(fields).toEqual(['company_name', 'company_description']);
    });

    it('should return correct fields for addresses', () => {
      const fields = getSearchFields('addresses');
      expect(fields).toEqual(['full_address', 'city', 'state', 'zipcode']);
    });

    it('should return empty array for unknown entity types', () => {
      // Type assertion to test runtime behavior with invalid input
      const fields = getSearchFields('unknown' as any);
      expect(fields).toEqual([]);
    });
  });

  describe('hasSearchFields', () => {
    it('should return true for entities with search fields', () => {
      expect(hasSearchFields('projects')).toBe(true);
      expect(hasSearchFields('companies')).toBe(true);
      expect(hasSearchFields('addresses')).toBe(true);
    });

    it('should return false for unknown entity types', () => {
      expect(hasSearchFields('unknown' as any)).toBe(false);
    });
  });
});

