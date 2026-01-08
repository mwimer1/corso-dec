/**
 * Scan usage for all style barrels (atoms, molecules, organisms).
 * Produces scripts/.cache/styles-usage.json for use by trim-styles-barrel.ts.
 *
 * Usage:
 *   pnpm scan:styles
 *   pnpm scan:styles:json    # outputs to JSON file
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project } from 'ts-morph';
import { z } from 'zod';
import { validateAllowlistFile } from './styles-keep-allowlist';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, '..', '..');
const CACHE_DIR = resolve(ROOT, 'scripts', '.cache');
const OUTPUT_PATH = resolve(CACHE_DIR, 'styles-usage.json');

const Args = z.object({
  format: z.enum(['table', 'json']).default('table'),
}).strict();

type TargetKey = 'atoms' | 'molecules' | 'organisms';
type TargetCfg = { key: TargetKey; spec: string; barrelPath: string; };

const TARGETS: Record<TargetKey, TargetCfg> = {
  atoms: {
    key: 'atoms',
    spec: '@/styles/ui/atoms',
    barrelPath: resolve(ROOT, 'styles', 'ui', 'atoms', 'index.ts'),
  },
  molecules: {
    key: 'molecules',
    spec: '@/styles/ui/molecules',
    barrelPath: resolve(ROOT, 'styles', 'ui', 'molecules', 'index.ts'),
  },
  organisms: {
    key: 'organisms',
    spec: '@/styles/ui/organisms',
    barrelPath: resolve(ROOT, 'styles', 'ui', 'organisms', 'index.ts'),
  },
};

function getTargets(): TargetCfg[] {
  return [TARGETS.atoms, TARGETS.molecules, TARGETS.organisms];
}

type ExportItem = {
  barrel: string;
  exportName: string;
  originModule: string;
  originFile?: string;
};

type Usage = {
  barrels: string[];
  usedNames: string[];
  mappingByBarrel: Record<string, { module: string; names: string[] }[]>;
};

function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--format=json') ? 'json' : 'table';

  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Validate allowlist file
  const allowlistPath = resolve(ROOT, 'scripts/analysis/styles-keep-allowlist.json');
  const allowlistResult = validateAllowlistFile(allowlistPath);

  if (!allowlistResult.success) {
    console.error('❌ Invalid styles-keep-allowlist.json:');
    for (const error of allowlistResult.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  const allowlist = allowlistResult.data!;
  console.log(`✅ Validated styles allowlist: ${allowlist.global.length} global, ${allowlist.atoms.length} atoms, ${allowlist.molecules.length} molecules, ${allowlist.organisms.length} organisms`);

  const project = new Project({
    tsConfigFilePath: resolve(ROOT, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  });

  const allExports: ExportItem[] = [];
  const usedNames = new Set<string>();
  const mappingByBarrel: Record<string, { module: string; names: string[] }[]> = {};

  // Scan each target barrel
  for (const target of getTargets()) {
    const sf = project.getSourceFile(target.barrelPath);
    if (!sf) {
      console.warn(`Barrel not found: ${target.barrelPath}`);
      continue;
    }

    const barrelPath = target.barrelPath;
    const relPath = barrelPath.replace(ROOT + sep, '');

    // Get all exports from this barrel
    sf.getExportDeclarations().forEach((ed) => {
      const mod = ed.getModuleSpecifierValue();
      const origin = ed.getModuleSpecifierSourceFile();
      ed.getNamedExports().forEach((ne) => {
        const name = ne.getName();
        const item: ExportItem = {
          barrel: relPath,
          exportName: name,
          originModule: mod ?? "",
          originFile: origin?.getFilePath() ?? "",
        };
        allExports.push(item);
      });
    });

    mappingByBarrel[relPath] = [];
  }

  // Find all source files that might import styles
  const sourceFiles = project.getSourceFiles();
  const styleImports = new Map<string, string[]>();

  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();

    // Skip test files, node_modules, and non-source files
    if (filePath.includes('.test.') ||
        filePath.includes('.spec.') ||
        filePath.includes('node_modules') ||
        filePath.includes('/tests/') ||
        filePath.includes('/__tests__/')) {
      continue;
    }

    // Look for style imports
    sf.getImportDeclarations().forEach((id) => {
      const mod = id.getModuleSpecifierValue();
      if (mod?.startsWith('@/styles/ui/')) {
        const importedNames = id.getNamedImports().map(ni => ni.getName());
        if (importedNames.length > 0) {
          styleImports.set(filePath, importedNames);
        }
      }
    });
  }

  // Build usage mapping
  for (const [filePath, names] of styleImports) {
    for (const name of names) {
      usedNames.add(name);

      // Find which barrel this name came from
      for (const exportItem of allExports) {
        if (exportItem.exportName === name) {
          const barrel = exportItem.barrel;
          if (!mappingByBarrel[barrel]) {
            mappingByBarrel[barrel] = [];
          }

          // Add to mapping if not already there
          const existing = mappingByBarrel[barrel].find(m => m.module === exportItem.originModule);
          if (existing) {
            if (!existing.names.includes(name)) {
              existing.names.push(name);
            }
          } else {
            mappingByBarrel[barrel].push({
              module: exportItem.originModule,
              names: [name],
            });
          }
        }
      }
    }
  }

  const barrels = Object.keys(mappingByBarrel);
  const usage: Usage = {
    barrels,
    usedNames: Array.from(usedNames),
    mappingByBarrel,
  };

  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Output JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(usage, null, 2));

  if (format === 'json') {
    console.log(JSON.stringify(usage, null, 2));
    return;
  }

  // Table format output
  console.log(`✅ Scanned style usage: ${usedNames.size} used names across ${barrels.length} barrels`);
  console.log(`📁 Output: ${OUTPUT_PATH}`);

  // Also print a summary to console
  for (const barrel of barrels) {
    const totalExports = allExports.filter(e => e.barrel === barrel).length;
    const usedInBarrel = usage.usedNames.filter(name =>
      allExports.some(e => e.barrel === barrel && e.exportName === name)
    ).length;
    console.log(`  ${barrel}: ${usedInBarrel}/${totalExports} used`);
  }
}

console.log('Starting scan-styles-usage script...');
main();

