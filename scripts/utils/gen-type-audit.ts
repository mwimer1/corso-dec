import fs from 'fs';
import { logger } from './logger';

interface MissingBarrelExport {
    path: string;
    domain: string;
}

interface Finding {
    path: string;
    line: number;
    severity: 'medium';
    description: 'Missing barrel export';
    suggested_fix: string;
}

const missing: MissingBarrelExport[] = fs.existsSync('audit-results/barrel-report.json')
  ? (JSON.parse(fs.readFileSync('audit-results/barrel-report.json', 'utf8')).missing ?? [])
  : [];

const findings: Finding[] = missing.map((m) => ({
  path: m.path,
  line: 1,
  severity: 'medium',
  description: 'Missing barrel export',
  suggested_fix: `add to ${m.domain}/index.ts`,
}));

try {
    fs.writeFileSync(
      'audit-results/types-findings.csv',
      'path,line,severity,description,suggested_fix\n' +
        findings
          .map((o) =>
            Object.values(o)
              .map((v) => `"${v}"`)
              .join(',')
          )
          .join('\n')
    );
    logger.success('✅ Type audit report generated successfully.');
} catch (error) {
    logger.error('❌ Failed to generate type audit report:', error);
    process.exit(1);
}

