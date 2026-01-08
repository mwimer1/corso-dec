import { glob } from 'glob';
import { readFileSync } from 'node:fs';

const BAD = /from\s+['"]@\/lib\/shared\/constants\/(?!index)([^'"]+)['"]/;

it("no deep imports from '@/lib/shared/constants/*'", async () => {
  const files = await glob('{app,components,lib,hooks,actions,contexts,types,styles}/**/*.{ts,tsx}', {
    ignore: ['**/*.d.ts', 'tests/**/*']
  });
  const offenders: string[] = [];
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    if (BAD.test(s)) offenders.push(f);
  }
  expect(offenders, `Deep imports found:\n${offenders.join('\n')}`).toHaveLength(0);
});

