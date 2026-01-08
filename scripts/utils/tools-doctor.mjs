#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function check(cmd, args = ['--version']) {
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  if (res.error) return { ok: false, version: null, err: res.error.message };
  return { ok: res.status === 0, version: (res.stdout || res.stderr || '').trim() };
}
function parseVersion(str) {
  const m = str.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}
const need = [];
const sg = check('sg');
if (!sg.ok) need.push('sg (ast-grep)');
const rg = check('rg');
if (!rg.ok) need.push('rg (ripgrep)');
const fd = check('fd');
if (!fd.ok) need.push('fd');
const gh = check('gh');
if (!gh.ok) need.push('gh (GitHub CLI)');
if (need.length) console.error('Missing tools:', need.join(', '));
let sgOk = false;
if (sg.ok) {
  const v = parseVersion(sg.version);
  if (v && (v.minor >= 38 || v.major > 0)) sgOk = true;
  else console.error(`ast-grep version too low: ${sg.version} (need >= 0.38.x)`);
}
const allOk = sgOk && rg.ok && fd.ok && gh.ok;
console.log('sg:', sg.version || 'missing');
console.log('rg:', rg.version || 'missing');
console.log('fd:', fd.version || 'missing');
console.log('gh:', gh.version || 'missing');
process.exit(allOk ? 0 : 1);


