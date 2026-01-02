import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'styles', 'ui', 'shared', 'component-variants.ts');
const SRC_DIRS = ['app','components','contexts','hooks','lib','pages','styles','tools'];

const disallowedImports = [
  "@/styles/ui/shared/component-variants",
  "@/styles/ui/shared",
];

const disallowedFiles = [
  "styles/ui/shared/component-variants.ts",
  "styles/ui/shared/index.ts",
  "styles/ui/organisms/chart.ts",
  "styles/ui/organisms/dialog.ts",
  "styles/ui/organisms/table-base.ts",
  "styles/ui/organisms/table-pro.ts",
];

function fileExists(p: string) { try { return fs.existsSync(p); } catch { return false; } }

function walk(dir: string, out: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) { walk(p, out); }
    else if (/\.(ts|tsx|mts|cts)$/.test(name)) out.push(p);
  }
}

let violations: string[] = [];

for (const file of disallowedFiles) {
  const fullPath = path.join(ROOT, file);
  if (fileExists(fullPath)) {
    violations.push(`File exists again: ${file}`);
  }
}

const files: string[] = [];
for (const d of SRC_DIRS) walk(path.join(ROOT, d), files);

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const imp of disallowedImports) {
    const re = new RegExp(String.raw`from\s*['"]${imp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
    if (re.test(src)) violations.push(`${path.relative(ROOT, f)} imports ${imp}`);
  }
}

if (violations.length) {
  console.error('❌ Orphaned variant files were reintroduced:\n' + violations.map(v => ' - ' + v).join('\n'));
  process.exitCode = 1;
} else {
  console.log('✅ No orphaned variant files present.');
}



