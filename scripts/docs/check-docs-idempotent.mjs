import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('pnpm', ['docs:index']);
const afterFirst = fs.existsSync('docs/index.ts') ? fs.readFileSync('docs/index.ts', 'utf8') : '';
run('pnpm', ['docs:index']);
const afterSecond = fs.existsSync('docs/index.ts') ? fs.readFileSync('docs/index.ts', 'utf8') : '';

if (afterFirst !== afterSecond) {
  console.error('Docs idempotency check failed: docs/index.ts changed between runs');
  process.exit(1);
}
console.log('Docs idempotency: OK');


