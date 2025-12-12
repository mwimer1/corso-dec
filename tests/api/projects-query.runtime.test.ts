import { describe, expect, it } from 'vitest';
// Import the file as a module to assert runtime boundary exports.
import * as Route from '@/app/api/v1/entity/[entity]/route';

describe('projects query route runtime boundary', () => {
  it('declares nodejs runtime with proper exports', () => {
    expect(Route.runtime).toBe('nodejs');
    expect(Route.dynamic).toBe('force-dynamic');
    expect(Route.revalidate).toBe(0);
  });
});

