// tests/lib/mocks/entity-data.server.test.ts

import { queryEntityFromCsv } from '@/lib/mocks/entity-data.server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the server environment
vi.mock('@/lib/integrations/env', () => ({
  requireServerEnv: vi.fn(() => ({ MOCK_ENTITY_DATA: 'true' })),
}));

// Mock file system
vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

// Mock path resolution
vi.mock('node:path', () => ({
  default: {
    resolve: vi.fn((...args) => args.join('/')),
  },
}));

describe('queryEntityFromCsv (Mock Data)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return projects data with all expected fields', async () => {
    const mockProjectsData = [
      {
        building_permit_id: 'TEST-001',
        status: 'COMPLETE',
        job_value: '1000',
        effective_date: '2023-01-01',
        city: 'Test City',
        state: 'TX',
        zipcode: '12345',
        property_type_major_category: 'Residential',
        property_type_sub_category: 'Single Family',
        contractor_names: 'Test Contractor',
        homeowner_names: 'Test Owner',
      },
    ];

    // Mock the file read
    const { readFile } = await import('node:fs/promises');
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockProjectsData));

    const result = await queryEntityFromCsv('projects', {
      page: 0,
      pageSize: 10,
      sort: { column: 'building_permit_id', direction: 'asc' },
    });

    expect(result).toEqual({
      data: [
        {
          building_permit_id: 'TEST-001',
          status: 'COMPLETE',
          job_value: 1000, // Should be converted to number
          effective_date: '2023-01-01',
          city: 'Test City',
          state: 'TX',
          zipcode: '12345',
          property_type_major_category: 'Residential',
          property_type_sub_category: 'Single Family',
          contractor_names: 'Test Contractor',
          homeowner_names: 'Test Owner',
        },
      ],
      total: 1,
      page: 0,
      pageSize: 10,
    });
  });

  it('should handle job_value as string with commas', async () => {
    const mockProjectsData = [
      {
        building_permit_id: 'TEST-002',
        status: 'COMPLETE',
        job_value: '1,500',
        effective_date: '2023-01-01',
        city: 'Test City',
        state: 'TX',
        zipcode: '12345',
        property_type_major_category: 'Commercial',
        property_type_sub_category: 'Office',
        contractor_names: 'Test Contractor',
        homeowner_names: 'Test Owner',
      },
    ];

    const { readFile } = await import('node:fs/promises');
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockProjectsData));

    const result = await queryEntityFromCsv('projects', {
      page: 0,
      pageSize: 10,
      sort: { column: 'building_permit_id', direction: 'asc' },
    });

    expect(result.data[0].job_value).toBe(1500); // Should parse comma-separated string to number
  });

  it('should handle contractors array for contractor_names', async () => {
    const mockProjectsData = [
      {
        building_permit_id: 'TEST-003',
        status: 'COMPLETE',
        job_value: 2000,
        effective_date: '2023-01-01',
        city: 'Test City',
        state: 'TX',
        zipcode: '12345',
        property_type_major_category: 'Industrial',
        property_type_sub_category: 'Warehouse',
        contractors: ['Contractor A', 'Contractor B'],
        owners: ['Owner X', 'Owner Y'],
      },
    ];

    const { readFile } = await import('node:fs/promises');
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockProjectsData));

    const result = await queryEntityFromCsv('projects', {
      page: 0,
      pageSize: 10,
      sort: { column: 'building_permit_id', direction: 'asc' },
    });

    expect(result.data[0].contractor_names).toBe('Contractor A, Contractor B');
    expect(result.data[0].homeowner_names).toBe('Owner X, Owner Y');
  });

  it('should throw error when MOCK_ENTITY_DATA is not true', async () => {
    // Mock environment to return false
    const { requireServerEnv } = await import('@/lib/integrations/env');
    vi.mocked(requireServerEnv).mockReturnValue({ MOCK_ENTITY_DATA: 'false' });

    await expect(
      queryEntityFromCsv('projects', {
        page: 0,
        pageSize: 10,
        sort: { column: 'building_permit_id', direction: 'asc' },
      })
    ).rejects.toThrow('Mock data source called but MOCK_ENTITY_DATA is not "true"');
  });

  it('should throw Zod validation error for invalid data', async () => {
    const invalidProjectsData = [
      {
        // Missing required building_permit_id
        status: 'COMPLETE',
        job_value: 1000,
      },
    ];

    const { readFile } = await import('node:fs/promises');
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidProjectsData));

    // Mock environment to return true
    const { requireServerEnv } = await import('@/lib/integrations/env');
    vi.mocked(requireServerEnv).mockReturnValue({ MOCK_ENTITY_DATA: 'true' });

    await expect(
      queryEntityFromCsv('projects', {
        page: 0,
        pageSize: 10,
        sort: { column: 'building_permit_id', direction: 'asc' },
      })
    ).rejects.toThrow(); // Should throw Zod validation error
  });

  it('should handle companies data correctly', async () => {
    const mockCompaniesData = [
      {
        contractor_id: 'COMP-001',
        contractor_name: 'Test Company',
        headcount: 50,
        job_value_ttm: 100000,
      },
    ];

    const { readFile } = await import('node:fs/promises');
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockCompaniesData));

    const result = await queryEntityFromCsv('companies', {
      page: 0,
      pageSize: 10,
      sort: { column: 'contractor_id', direction: 'asc' },
    });

    expect(result.data[0]).toEqual({
      contractor_id: 'COMP-001',
      contractor_name: 'Test Company',
      headcount: 50,
      job_value_ttm: 100000,
    });
  });

  it('should handle addresses data correctly', async () => {
    const mockAddressesData = [
      {
        full_address: '123 Test St, Test City, TX 12345',
        city: 'Test City',
        state: 'TX',
        zipcode: '12345',
        property_type_major_category: 'Residential',
      },
    ];

    const { readFile } = await import('node:fs/promises');
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockAddressesData));

    const result = await queryEntityFromCsv('addresses', {
      page: 0,
      pageSize: 10,
      sort: { column: 'full_address', direction: 'asc' },
    });

    expect(result.data[0]).toEqual({
      full_address: '123 Test St, Test City, TX 12345',
      city: 'Test City',
      state: 'TX',
      zipcode: '12345',
      property_type_major_category: 'Residential',
    });
  });
});

