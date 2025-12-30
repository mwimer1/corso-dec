import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function hasVar(css: string, name: string) {
  const re = new RegExp(`--${name}\\s*:`, 'i');
  return re.test(css);
}

describe('Typography token presence', () => {
  const typographyCssPath = join(process.cwd(), 'styles', 'tokens', 'typography.css');
  const typographyCss = readFileSync(typographyCssPath, 'utf8');

  it('ensures large typography tokens exist (7xl–9xl)', () => {
    ['text-7xl', 'text-8xl', 'text-9xl'].forEach(name => {
      expect(hasVar(typographyCss, name)).toBe(true);
    });
  });
});

