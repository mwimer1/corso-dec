import { describe, expect, it } from 'vitest';

// Simple pure helper to mirror the guard in use-shallow-sync-table-url-state
const shouldReplace = (currentQS: string, nextQS: string) => currentQS !== nextQS;

describe('URL replace guard', () => {
  it('does not replace when querystring is identical', () => {
    const current = 'page=1&pageSize=25&sortBy=name&sortDir=asc';
    const next = 'page=1&pageSize=25&sortBy=name&sortDir=asc';
    expect(shouldReplace(current, next)).toBe(false);
  });
  it('replaces when querystring differs', () => {
    const current = 'page=1&pageSize=25';
    const next = 'page=2&pageSize=25';
    expect(shouldReplace(current, next)).toBe(true);
  });
});

