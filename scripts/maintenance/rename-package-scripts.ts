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
  'atoms:trim:batch01': 'cleanup:atoms:trim:batch01',

  'organisms:scan': 'scan:organisms',
  'organisms:trim': 'cleanup:organisms:trim',

  'shared:scan': 'scan:shared',

  'rules:phase1': 'guards:rules:phase1',

  'codemod:styles:resolve-shared': 'codemods:styles:resolve-shared',

  'unused-exports:report': 'audit:unused-exports:report',
  'unused-exports:apply': 'fix:unused-exports:apply',
};

const pkgPath = path.resolve(process.cwd(), 'package.json');
const raw = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(raw);
const scripts: Record<string, string> = pkg.scripts ?? {};

const toRename = Object.entries(mapping).filter(([oldKey]) => oldKey in scripts);
if (toRename.length === 0) {
  console.log('No matching legacy script keys found. Nothing to do.');
  process.exit(0);
}

// Guard against accidental overwrites with different values.
const collisions: string[] = [];
for (const [oldKey, newKey] of toRename) {
  if (newKey in scripts && scripts[newKey] !== scripts[oldKey]) {
    collisions.push(`${newKey} (old="${scripts[oldKey]}", new="${scripts[newKey]}")`);
  }
}
if (collisions.length) {
  console.error('Refusing to overwrite existing script(s):\n- ' + collisions.join('\n- '));
  process.exit(1);
}

// Apply renames (preserve values).
for (const [oldKey, newKey] of toRename) {
  const val = scripts[oldKey];
  if (typeof val === 'undefined') continue;
  scripts[newKey] = val;
  delete scripts[oldKey];
}

pkg.scripts = scripts;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Renamed ${toRename.length} script key(s).`);



