/**
 * Unit tests for AI chat tool definitions and routing
 */

import { describe, expect, it } from 'vitest';
import { getChatCompletionsTools, executeSqlFunction, describeSchemaFunction } from '@/lib/api/ai/chat/tools';

describe('getChatCompletionsTools', () => {
  it('should return array with execute_sql and describe_schema tools', () => {
    const tools = getChatCompletionsTools();
    
    expect(tools).toHaveLength(2);
    expect(tools[0]).toBe(executeSqlFunction);
    expect(tools[1]).toBe(describeSchemaFunction);
  });

  it('should return tools in correct order', () => {
    const tools = getChatCompletionsTools();
    
    expect(tools[0]?.function.name).toBe('execute_sql');
    expect(tools[1]?.function.name).toBe('describe_schema');
  });
});

describe('executeSqlFunction', () => {
  it('should have correct function definition', () => {
    expect(executeSqlFunction.type).toBe('function');
    expect(executeSqlFunction.function.name).toBe('execute_sql');
    expect(executeSqlFunction.function.description).toContain('SELECT');
    expect(executeSqlFunction.function.description).toContain('100 rows');
  });

  it('should have query parameter defined', () => {
    const params = executeSqlFunction.function.parameters;
    expect(params.type).toBe('object');
    expect(params.properties).toHaveProperty('query');
    expect(params.required).toContain('query');
  });
});

describe('describeSchemaFunction', () => {
  it('should have correct function definition', () => {
    expect(describeSchemaFunction.type).toBe('function');
    expect(describeSchemaFunction.function.name).toBe('describe_schema');
    expect(describeSchemaFunction.function.description).toContain('schema');
    expect(describeSchemaFunction.function.description).toContain('columns');
  });

  it('should have no required parameters', () => {
    const params = describeSchemaFunction.function.parameters;
    expect(params.type).toBe('object');
    expect(params.required).toEqual([]);
  });
});
