import { TableColumnConfigSchema, TableColumnFormatEnum } from '@/lib/entities/types';
import { describe, expect, it } from 'vitest';

describe('TableColumnConfigSchema', () => {
  it('validates a minimal config', () => {
    const config = {
      id: 'name',
      label: 'Name',
      accessor: 'name',
    };

    const result = TableColumnConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: 'name',
      label: 'Name',
      accessor: 'name',
      sortable: false, // default value
      hidden: false, // default value
    });
  });

  it('validates a full config with all options', () => {
    const config = {
      id: 'value',
      label: 'Value',
      i18nKey: 'entity.value',
      accessor: 'project_value',
      sortable: true,
      hidden: false,
      width: 120,
      minWidth: 100,
      flex: 1,
      format: 'currency' as const,
      a11y: {
        headerAriaLabel: 'Project value in dollars'
      }
    };

    const result = TableColumnConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(config);
  });

  it('rejects invalid format', () => {
    const config = {
      id: 'test',
      label: 'Test',
      accessor: 'test',
      format: 'invalid' as any,
    };

    const result = TableColumnConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const config = {
      accessor: 'test',
      // missing id and label
    };

    const result = TableColumnConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('validates all supported formats', () => {
    const formats = ['text', 'number', 'currency', 'date', 'datetime', 'badge', 'link'];

    formats.forEach(format => {
      const config = {
        id: 'test',
        label: 'Test',
        accessor: 'test',
        format: format as any,
      };

      const result = TableColumnConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});

describe('TableColumnFormatEnum', () => {
  it('accepts all valid format values', () => {
    const validFormats = ['text', 'number', 'currency', 'date', 'datetime', 'badge', 'link'];

    validFormats.forEach(format => {
      const result = TableColumnFormatEnum.safeParse(format);
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid format values', () => {
    const invalidFormats = ['html', 'json', 'xml', ''];

    invalidFormats.forEach(format => {
      const result = TableColumnFormatEnum.safeParse(format);
      expect(result.success).toBe(false);
    });
  });
});

