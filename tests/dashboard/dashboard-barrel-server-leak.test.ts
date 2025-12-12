import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('Dashboard barrel does not leak server-only exports', () => {
  it('components/dashboard/index.ts must not re-export server-only symbols', () => {
    const barrel = path.resolve(process.cwd(), 'components', 'dashboard', 'index.ts');
    expect(fs.existsSync(barrel), 'Missing components/dashboard/index.ts').toBe(true);

    const src = fs.readFileSync(barrel, 'utf8');

    // Look for actual export statements, not comments
    const badNamePatterns = [
      /^export\s+.*\bbuildEntityPage\b/,
    ];

    const badExportFromServer = /export\s+.*from\s+['"].*lib\/server.*['"]/;

    // Check for actual exports (not in comments)
    const lines = src.split('\n');
    const actualExports = lines.filter(line =>
      line.trim().startsWith('export') &&
      !line.trim().startsWith('//') &&
      !line.trim().startsWith('/*')
    ).join('\n');

    const badNames = badNamePatterns.filter(rx => rx.test(actualExports));
    const badServerExport = badExportFromServer.test(actualExports);

    expect(badNames.length, `Server-only names re-exported in dashboard barrel: ${badNames.map(r => r.source).join(', ')}`).toBe(0);
    expect(badServerExport, 'Dashboard barrel must not export from lib/server/*').toBe(false);
  });
});

