import { describe, expect, test } from 'vitest';

describe('tailwind config re-export', () => {
  test('root tailwind.config re-exports styles/tailwind.config', async () => {
    // Import TS configs as ESM defaults (jiti handles TS on consumers like Tailwind)
    const root = (await import('../../tailwind.config')).default as any;
    const styles = (await import('../../styles/tailwind.config')).default as any;
    expect(root).toBeDefined();
    expect(styles).toBeDefined();
    // Sanity checks
    expect(typeof root).toBe('object');
    expect(typeof styles).toBe('object');
    // Ensure the two configs are aligned at key structure points
    expect(!!root.theme).toBe(!!styles.theme);
    expect(!!root.plugins).toBe(!!styles.plugins);
  });
});

