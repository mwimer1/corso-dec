#!/usr/bin/env tsx
import { globby } from 'globby';
import path from 'node:path';
import { renderReadme, writeIfChanged, findReadmes } from '../../utils/docs-template-engine';

async function main() {
  // pick a single canonical template name: "README.scripts" => template file: README.scripts.hbs
  const template = 'README.scripts';

  // Example shared context — add per-domain data here (counts, exports, etc.)
  const baseCtx = {
    last_updated: new Date().toISOString().slice(0,10),
    project: 'Corso MVP',
  };

  const patterns = findReadmes();
  const files = await globby(patterns, { gitignore: true });

  let changed = 0;
  for (const file of files) {
    const dir = path.dirname(file);
    const ctx = { ...baseCtx, directory: dir.replace(/\\/g, '/') };
    const out = renderReadme(template, ctx);
    if (writeIfChanged(file, out)) changed++;
  }
  console.log(changed ? `✅ Updated ${changed} README(s)` : '✅ READMEs already up to date');
}
void main().catch(e => { console.error(e); process.exit(1); });

