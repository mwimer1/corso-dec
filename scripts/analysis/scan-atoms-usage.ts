/**
 * Scan usage for atoms barrels (styles/components).
 * Produces JSON per target:
 *   - scripts/.cache/atoms-styles-usage.json
 *   - scripts/.cache/atoms-components-usage.json
 *
 * Usage:
 *   pnpm scan:atoms                   // scans both
 *   pnpm scan:atoms:styles            // styles only
 *   pnpm scan:atoms:components        // components only
 *   pnpm scan:atoms:strict            // both, fail if any unused
 *   tsx scripts/analysis/scan-atoms-usage.ts --target=styles|components|both --strict
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project, SyntaxKind } from 'ts-morph';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, '..', '..');
const CACHE_DIR = resolve(ROOT, 'scripts', '.cache');
const STRICT = process.argv.includes('--strict');
const TARGET_ARG = (process.argv.find(a => a.startsWith('--target='))?.split('=')[1] ?? 'both') as 'styles' | 'components' | 'organisms' | 'both';

type TargetKey = 'styles' | 'components' | 'organisms';
type TargetCfg = { key: TargetKey; spec: string; barrelPath: string; outPath: string; };

const TARGETS: Record<TargetKey, TargetCfg> = {
  styles: {
    key: 'styles',
    spec: '@/styles/ui/atoms',
    barrelPath: resolve(ROOT, 'styles', 'ui', 'atoms', 'index.ts'),
    outPath: resolve(CACHE_DIR, 'atoms-styles-usage.json'),
  },
  components: {
    key: 'components',
    spec: '@/components/ui/atoms',
    barrelPath: resolve(ROOT, 'components', 'ui', 'atoms', 'index.ts'),
    outPath: resolve(CACHE_DIR, 'atoms-components-usage.json'),
  },
  organisms: {
    key: 'organisms',
    spec: '@/styles/ui/organisms',
    barrelPath: resolve(ROOT, 'styles', 'ui', 'organisms', 'index.ts'),
    outPath: resolve(CACHE_DIR, 'organisms-styles-usage.json'),
  },
};

function getTargets(): TargetCfg[] {
  if (TARGET_ARG === 'both') return [TARGETS.styles, TARGETS.components];
  return [TARGETS[TARGET_ARG]];
}

async function main() {
  const project = new Project({
    tsConfigFilePath: resolve(ROOT, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  });

  const targets = getTargets();
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

  let anyUnused = false;
  for (const t of targets) {
    const barrel = project.getSourceFile(t.barrelPath);
    if (!barrel) {
       
      console.warn(`⚠️ Skipping missing barrel: ${t.barrelPath}`);
      continue;
    }

    // 1) Gather export names from the barrel
    const exportMap = barrel.getExportedDeclarations();
    const allExports = Array.from(exportMap.keys()).sort();

    // 2) Gather used names via import declarations to the barrel
    const used = new Set<string>();
    for (const sf of project.getSourceFiles()) {
      const fp = sf.getFilePath();
      if (fp === t.barrelPath) continue;
      if (fp.includes(`${sep}node_modules${sep}`) || fp.includes(`${sep}.next${sep}`) || fp.includes(`${sep}.turbo${sep}`)) continue;
      for (const imp of sf.getImportDeclarations()) {
        const spec = imp.getModuleSpecifierValue();
        if (!(spec === t.spec || spec.endsWith(t.spec.replace('@', '')))) continue;
        // Count both type and value named imports
        for (const n of imp.getNamedImports()) used.add(n.getName());
        const clause = imp.getFirstChildByKind(SyntaxKind.ImportClause);
        if (clause) {
          for (const el of clause.getDescendantsOfKind(SyntaxKind.ImportSpecifier)) {
            const name = el.getNameNode().getText();
            if (name) used.add(name);
          }
        }
      }
    }

    const usedArr = Array.from(used).sort();
    const unused = allExports.filter((e) => !used.has(e));
    const report = { target: t.key, spec: t.spec, barrel: t.barrelPath, allExports, used: usedArr, unused };
    writeFileSync(t.outPath, JSON.stringify(report, null, 2));

     
    console.log(`Atoms usage report (${t.key}) → ${t.outPath}`);
     
    console.log(`All exports: ${allExports.length}`);
     
    console.log(`Used:        ${usedArr.length}`);
     
    console.log(`Unused:      ${unused.length}`);
    if (unused.length) {
       
      console.log('\nUnused names:\n- ' + unused.join('\n- '));
    }
    anyUnused = anyUnused || unused.length > 0;
  }

  if (STRICT && anyUnused) {
     
    console.error('\n❌ Unused atom exports detected. (strict mode)');
    process.exit(1);
  }
}

main().catch((err) => {
   
  console.error(err);
  process.exit(1);
});

