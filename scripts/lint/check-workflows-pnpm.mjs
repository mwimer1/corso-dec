#!/usr/bin/env node
import globby from 'globby';
import fs from 'node:fs';
import path from 'node:path';

const files = globby.sync(['.github/workflows/*.yml', '.github/workflows/*.yaml'], { dot: true });
const offenders = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const usesComposite = content.includes('./.github/actions/setup-node-pnpm');
  const callsPnpm = /\bpnpm\b/.test(content);
  if (callsPnpm && !usesComposite) {
    offenders.push(filePath);
  }
}

if (offenders.length > 0) {
  console.error('Workflows using pnpm must use ./.github/actions/setup-node-pnpm:');
  for (const offender of offenders) {
    console.error(' - ' + path.relative(process.cwd(), offender));
  }
  process.exit(1);
}

console.log('All pnpm-using workflows reference the composite setup action.');


