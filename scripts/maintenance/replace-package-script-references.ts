import fs from 'node:fs';
import path from 'node:path';

type Map = Record<string, string>;

const mapping: Map = {
  'ui:scan': 'scan:ui',
  'ui:scan:json': 'scan:ui:json',
  'ui:trim': 'cleanup:ui:trim',
  'ui:trim:write': 'cleanup:ui:trim:write',
  'ui:trim:delete': 'cleanup:ui:trim:delete',

  'shared:trim:dry': 'cleanup:shared:trim:dry',
  'shared:trim': 'cleanup:shared:trim',
  'shared:trim:prune': 'cleanup:shared:trim:prune',

  'styles:scan': 'scan:styles',
  'styles:trim': 'cleanup:styles:trim',
  'styles:purge': 'cleanup:styles:purge',
  'styles:cleanup': 'cleanup:styles',

  'codemod:check-exports': 'codemods:check-exports',

  'atoms:scan': 'scan:atoms',
  'atoms:scan:styles': 'scan:atoms:styles',
  'atoms:scan:components': 'scan:atoms:components',
  'atoms:scan:strict': 'scan:atoms:strict',
  'atoms:trim': 'cleanup:atoms:trim',
  'atoms:trim:components': 'cleanup:atoms:trim:components',
  'atoms:trim:styles:leaf': 'cleanup:atoms:trim:styles:leaf',
  'atoms:trim:components:leaf': 'cleanup:atoms:trim:components:leaf',
  'atoms:purge:components': 'cleanup:atoms:purge:components',

  'organisms:scan': 'scan:organisms',
  'organisms:trim': 'cleanup:organisms:trim',

  'shared:scan': 'scan:shared',

  'rules:phase1': 'guards:rules:phase1',

  'codemod:styles:resolve-shared': 'codemods:styles:resolve-shared',

  'unused-exports:report': 'audit:unused-exports:report',
  'unused-exports:apply': 'fix:unused-exports:apply',
};

const repoRoot = process.cwd();

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldIgnore(filePath: string) {
  const rel = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  if (rel.startsWith('node_modules/') || rel.startsWith('.git/') || rel.startsWith('.cursor/')) return true;
  // Keep our maintenance scripts intact (they contain canonical mapping)
  if (rel.startsWith('scripts/maintenance/')) return true;
  return false;
}

function walk(dir: string, cb: (file: string) => void) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(file, cb);
    } else {
      cb(file);
    }
  }
}

let totalFiles = 0;
let totalReplacements = 0;

walk(repoRoot, (file) => {
  if (shouldIgnore(file)) return;
  const ext = path.extname(file).toLowerCase();
  const allowedExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx', '.json', '.yml', '.yaml', '.txt']);
  if (!allowedExts.has(ext)) return;

  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  for (const [oldKey, newKey] of Object.entries(mapping)) {
    const escOld = escapeRegex(oldKey);
    // Replace pnpm invocation forms: pnpm[-w] [run] OLD
    const pnpmPattern = new RegExp(`(pnpm(?:\\s+-w)?(?:\\s+run)?\\s+)${escOld}(?=\\b)`, 'g');
    content = content.replace(pnpmPattern, `$1${newKey}`);

    // Replace standalone mentions with simple boundaries (avoid altering words)
    const standalone = new RegExp(`(?<![A-Za-z0-9])${escOld}(?![A-Za-z0-9])`, 'g');
    content = content.replace(standalone, newKey);
  }

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    const diffCount = content.split('\n').length - orig.split('\n').length;
    totalFiles += 1;
    totalReplacements += 1;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Done. Updated ${totalFiles} file(s). Performed ${totalReplacements} replacement batches.`);



