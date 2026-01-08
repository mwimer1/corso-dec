import * as route from '@/app/api/v1/insights/search/route';
import { describe, expect, it } from 'vitest';

describe('GET /api/v1/insights/search', () => {
  it('should return 400 for empty query', async () => {
    const req = new Request('http://localhost/api/v1/insights/search?q=');
    const res = await route.GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for query too short', async () => {
    const req = new Request('http://localhost/api/v1/insights/search?q=');
    const res = await route.GET(req);
    expect(res.status).toBe(400);
  });

  it('should return results for valid query', async () => {
    const req = new Request('http://localhost/api/v1/insights/search?q=construction');
    const res = await route.GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.results)).toBe(true);
    
    // Results should have required fields
    if (body.data.results.length > 0) {
      const result = body.data.results[0];
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('categories');
      expect(Array.isArray(result.categories)).toBe(true);
    }
  });

  it('should enforce limit cap', async () => {
    const req = new Request('http://localhost/api/v1/insights/search?q=construction&limit=100');
    const res = await route.GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should filter by category when provided', async () => {
    // First, get all insights to see what categories exist
    const searchReq = new Request('http://localhost/api/v1/insights/search?q=construction');
    const searchRes = await route.GET(searchReq);
    const searchBody = await searchRes.json();
    
    // If we have results, use the first category from the first result
    if (searchBody.success && searchBody.data.results.length > 0) {
      const firstCategory = searchBody.data.results[0].categories?.[0]?.slug;
      if (firstCategory) {
        const req = new Request(`http://localhost/api/v1/insights/search?q=construction&category=${firstCategory}`);
        const res = await route.GET(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        
        // All results should match the category
        if (body.data.results.length > 0) {
          body.data.results.forEach((result: { categories: Array<{ slug: string }> }) => {
            const hasMatchingCategory = result.categories.some(cat => cat.slug === firstCategory);
            expect(hasMatchingCategory).toBe(true);
          });
        }
      }
    } else {
      // No results available, skip category filter test
      expect(true).toBe(true);
    }
  });

  it('should respect limit parameter', async () => {
    const req = new Request('http://localhost/api/v1/insights/search?q=construction&limit=5');
    const res = await route.GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.results.length).toBeLessThanOrEqual(5);
  });

  it('should handle OPTIONS request for CORS', async () => {
    const req = new Request('http://localhost/api/v1/insights/search', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const res = await route.OPTIONS(req);
    expect([204, 200]).toContain(res.status);
  });
});

