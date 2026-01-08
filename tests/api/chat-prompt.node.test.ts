// tests/api/chat-prompt.node.test.ts
// Sprint 4: Tests for chat prompt generation and schema helpers

import { getSchemaJSON, getSchemaSummary } from '@/lib/integrations/database/sql-guard';
import { describe, expect, it } from 'vitest';

describe('Chat Prompt & Schema Helpers', () => {
  describe('getSchemaSummary', () => {
    it('should return formatted schema summary with all tables', () => {
      const summary = getSchemaSummary();
      
      // Should include all three tables
      expect(summary).toContain('projects(');
      expect(summary).toContain('companies(');
      expect(summary).toContain('addresses(');
      
      // Should not include org_id (automatically injected)
      expect(summary).not.toContain('org_id');
      
      // Should be formatted with newlines
      expect(summary).toContain('\n');
      
      // Should include common columns
      expect(summary).toContain('id');
      expect(summary).toContain('name');
    });
    
    it('should have columns sorted alphabetically', () => {
      const summary = getSchemaSummary();
      const projectsMatch = summary.match(/projects\((.*?)\)/);
      
      if (projectsMatch) {
        const columns = projectsMatch[1]!.split(', ').map(c => c.trim());
        const sorted = [...columns].sort();
        expect(columns).toEqual(sorted);
      }
    });
  });
  
  describe('getSchemaJSON', () => {
    it('should return schema as JSON object', () => {
      const schema = getSchemaJSON();
      
      // Should have all three tables
      expect(schema).toHaveProperty('projects');
      expect(schema).toHaveProperty('companies');
      expect(schema).toHaveProperty('addresses');
      
      // Should be arrays of strings
      expect(Array.isArray(schema.projects)).toBe(true);
      expect(Array.isArray(schema.companies)).toBe(true);
      expect(Array.isArray(schema.addresses)).toBe(true);
      
      // Should not include org_id
      expect(schema.projects).not.toContain('org_id');
      expect(schema.companies).not.toContain('org_id');
      expect(schema.addresses).not.toContain('org_id');
      
      // Should include common columns
      expect(schema.projects).toContain('id');
      expect(schema.projects).toContain('name');
      expect(schema.companies).toContain('id');
      expect(schema.companies).toContain('name');
      expect(schema.addresses).toContain('id');
    });
    
    it('should have columns sorted alphabetically', () => {
      const schema = getSchemaJSON();
      
      for (const table of ['projects', 'companies', 'addresses'] as const) {
        const columns = schema[table];
        const sorted = [...columns].sort();
        expect(columns).toEqual(sorted);
      }
    });
    
    it('should be valid JSON when stringified', () => {
      const schema = getSchemaJSON();
      const jsonString = JSON.stringify(schema);
      
      expect(() => JSON.parse(jsonString)).not.toThrow();
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(schema);
    });
  });
});

