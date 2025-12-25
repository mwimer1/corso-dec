#!/usr/bin/env tsx
/**
 * scripts/maintenance/generate-readme.ts
 * -------------------------------------------------------------
 * A configurable script to scan domain folders and update their README.md files.
 * It lists exported entities, and warns if they are missing from barrel files.
 *
 * Usage: pnpm tsx scripts/maintenance/generate-readme.ts
 */
import fs from 'fs';
import { globbySync } from 'globby';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseMd, stringifyMd } from './_utils/frontmatter';
import { readBarrelExports, readBarrelReferencedModules } from '../utils/barrel-utils';
import { LIB_POLICIES } from './barrel.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

type ReadmeKind =
  | 'Guard'
  | 'Security'
  | 'Style'
  | 'Unit'
  | 'Integration'
  | 'Component'
  | 'Action'
  | 'Provider'
  | 'Variant'
  | 'Type'
  | 'Script'
  | 'Tool'
  | 'File'
  | 'Support';

interface DomainConfig {
  name: string;
  baseDir: string;
  getDomains: () => string[];
  getExports: (domainPath: string) => string[];
  buildReadmeTable: (exports: string[], domain: string, kind?: ReadmeKind) => string;
  checkBarrel?: boolean;
}


function readContextsBarrelExports(domainPath: string): string[] {
  const indexPath = path.join(domainPath, 'index.ts');
  if (!fs.existsSync(indexPath)) return [];
  
  const content = fs.readFileSync(indexPath, 'utf8');
  const exportRegex = /export\s+\*\s+from\s+'\.\/(.*?)';/g;
  const exports: string[] = [];
  let match;
  
  while ((match = exportRegex.exec(content))) {
    const modulePath = match[1] ?? '';
    if (modulePath) {
      // Read the actual module to extract exported names
      const fullModulePath = path.join(domainPath, modulePath + '.tsx');
      if (fs.existsSync(fullModulePath)) {
        const moduleContent = fs.readFileSync(fullModulePath, 'utf8');
        
        // Extract provider exports
        const providerRegex = /\b(?:export\s+)?(?:function|const|class)\s+(\w+Provider)\b/g;
        let pm;
        while ((pm = providerRegex.exec(moduleContent))) {
          exports.push(pm[1] ?? '');
        }
        
        // Extract hook exports
        const hookRegex = /\b(?:export\s+)?(?:function|const)\s+(use[A-Z]\w+)/g;
        let hm;
        while ((hm = hookRegex.exec(moduleContent))) {
          exports.push(hm[1] ?? '');
        }
      }
    }
  }
  
  return exports;
}

/**
 * Recursively read barrel exports starting from a directory that has an index.ts barrel.
 * This is used for hierarchical barrels like components/ui which re-export atoms/molecules/organisms.
 */
function readAllBarrelModules(rootDir: string, visited: Set<string> = new Set()): string[] {
  const results: string[] = [];
  const indexPath = path.join(rootDir, 'index.ts');
  if (!fs.existsSync(indexPath)) return results;

  // Avoid cycles
  const dirKey = path.resolve(rootDir);
  if (visited.has(dirKey)) return results;
  visited.add(dirKey);

  const direct = readBarrelExports(rootDir);
  results.push(...direct);

  // Traverse into subdirectories that are re-exported (e.g., './atoms', './molecules', './organisms')
  for (const mod of direct) {
    const subDir = path.join(rootDir, mod);
    const subIndex = path.join(subDir, 'index.ts');
    if (fs.existsSync(subIndex)) {
      results.push(...readAllBarrelModules(subDir, visited));
    } else {
      // Also traverse one more level for nested sub-barrels like './data-table' inside molecules
      // when parent index re-exports './data-table'
      const parts = mod.split('/');
      if (parts.length > 1) {
        const [first] = parts;
        if (!first) {
          continue;
        }
        const nestedDir = path.join(rootDir, first);
        const nestedIndex = path.join(nestedDir, 'index.ts');
        if (fs.existsSync(nestedIndex)) {
          results.push(...readAllBarrelModules(nestedDir, visited));
        }
      }
    }
  }

  // Return unique, flattened list
  return Array.from(new Set(results));
}

function updateReadme(readmePath: string, table: string) {
  if (!fs.existsSync(readmePath)) {
    console.warn(`[generate-readme] README.md missing at ${readmePath}`);
    return;
  }
  const readme = fs.readFileSync(readmePath, 'utf8');
  const { data, content } = parseMd(readme);
  let body = content;
  // Remove existing Public Exports section (header to next header) if present
  body = body.replace(/\n##\s+Public\s+Exports[\s\S]*?(?=\n##\s+|\n#\s+|$)/g, '\n');
  // Inject at the top of body after any initial newlines
  const trimmed = body.replace(/^\n+/, '');
  const injection = `## Public Exports\n${table}\n\n`;
  const nextBody = `${injection}${trimmed}`;
  const next = stringifyMd(data, nextBody);
  if (next !== readme) {
    fs.writeFileSync(readmePath, next);
  }
}
function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
}

function globToRegExp(glob: string): RegExp {
  const norm = glob.replace(/\\/g, '/');
  // Escape regex specials except '*' which we'll handle
  let pattern = escapeRegex(norm);
  // Temporarily mark doublestar to avoid replacement conflicts
  pattern = pattern.replace(/\*\*/g, '§§DOUBLESTAR§§');
  // Single star → any chars except '/'
  pattern = pattern.replace(/\*/g, '[^/]*');
  // Double star → any chars including '/'
  pattern = pattern.replace(/§§DOUBLESTAR§§/g, '.*');
  return new RegExp('^' + pattern + '$');
}

function isInternalToPolicy(rootDir: string, candidateRelPath: string): boolean {
  // Compute repo-relative path for matching against policy globs
  const absCandidate = path.join(rootDir, candidateRelPath);
  const relToRepo = path.relative(ROOT, absCandidate).replace(/\\/g, '/');
  const candidates = [relToRepo, relToRepo + '.ts', relToRepo + '.tsx', relToRepo.replace(/\/$/, '') + '/index.ts'];
  const policy = LIB_POLICIES.find(p => relToRepo.startsWith(p.root));
  if (!policy) return false;
  const isInternal = policy.internal.some(glob => {
    const re = globToRegExp(glob);
    return candidates.some(c => re.test(c));
  });
  if (!isInternal) return false;
  if (policy.publicHints && policy.publicHints.length > 0) {
    const isHint = policy.publicHints.some(glob => {
      const re = globToRegExp(glob);
      return candidates.some(c => re.test(c));
    });
    if (isHint) return false;
  }
  return true;
}


const CONFIGS: DomainConfig[] = [
    {
        name: 'Actions',
        baseDir: path.join(ROOT, 'actions'),
        // Root-aware: single README and single barrel at actions/index.ts
        getDomains: () => [''],
        getExports: (domainPath: string) => {
            const actionFiles = globbySync(['**/*.ts', '!index.ts', '!**/*.test.ts', '!**/schemas.ts'], { cwd: domainPath });
            return actionFiles.map((relPath) => {
                const noExt = relPath.replace(/\.ts$/, '');
                if (noExt.endsWith('/index')) {
                    return noExt.replace(/\/index$/, '');
                }
                return noExt;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Action') => {
            const rows = exports.map((a) => `| \`${a}\` |  | \`@/actions\` |`).join('\n');
            return `| ${kind} | Purpose | Import Path |\n|--------|---------|-------------|\n${rows}`;
        },
        checkBarrel: true,
    },
    {
        name: 'Components',
        baseDir: path.join(ROOT, 'components'),
        getDomains: () => fs.readdirSync(path.join(ROOT, 'components'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name),
        getExports: (domainPath: string) => {
            // Derive public components from barrels rather than scanning all files to avoid false positives
            const modules = readAllBarrelModules(domainPath);
            return Array.from(new Set(modules.map(m => path.basename(m))));
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Component') => {
            const rows = exports.map((c) => `| \`${c}\` |  | \`@/components/${_domain}\` |`).join('\n');
            return `| ${kind} | Purpose | Import Path |\n|-----------|---------|-------------|\n${rows}`;
        },
        checkBarrel: true,
    },
    {
        name: 'Contexts',
        baseDir: path.join(ROOT, 'contexts'),
        getDomains: () => [''], // Single root barrel, no subdomain barrels
        getExports: (domainPath: string) => {
            // Scan all provider files in subdirectories for the root barrel
            const allProviderFiles = globbySync(['**/*provider.tsx', '**/*-provider.tsx'], { cwd: path.join(ROOT, 'contexts') });
            const identifiers = new Set<string>();
            
            allProviderFiles.forEach(fileRel => {
                const fullPath = path.join(ROOT, 'contexts', fileRel);
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // Extract provider exports
                const providerRegex = /\b(?:export\s+)?(?:function|const|class)\s+(\w+Provider)\b/g;
                let pm;
                while ((pm = providerRegex.exec(content))) {
                    identifiers.add(pm[1] ?? '');
                }
                
                // Extract hook exports
                const hookRegex = /\b(?:export\s+)?(?:function|const)\s+(use[A-Z]\w+)/g;
                let hm;
                while ((hm = hookRegex.exec(content))) {
                    identifiers.add(hm[1] ?? '');
                }
            });
            
            return Array.from(identifiers);
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Provider') => {
            const rows = exports.map(e => {
                if (e.endsWith('Provider')) {
                    return `| \`${e}\` |  | React context provider | \`@/contexts\``;
                }
                return `|  | \`${e}\` | React hook | \`@/contexts\``;
            }).join('\n');
            return `| ${kind} | Hook | Purpose | Import Path |\n|----------|------|---------|-------------|\n${rows}`;
        },
        checkBarrel: false, // No subdomain barrels to validate - single root barrel
    },

    {
        name: 'Styles',
        baseDir: path.join(ROOT, 'styles'),
        getDomains: () => ['atoms', 'molecules', 'organisms', 'tokens', 'utils'],
        getExports: (domainPath: string) => {
            const domain = path.basename(domainPath);
            if (domain === 'tokens') {
                return globbySync(['*.css'], { cwd: domainPath }).map(f => path.basename(f));
            }
            const tsFiles = globbySync(['**/*.ts'], { cwd: domainPath });
            return tsFiles
                .filter(f => {
                    if (path.basename(f) === 'index.ts') return false;
                    const content = fs.readFileSync(path.join(domainPath, f), 'utf8');
                    return f.endsWith('-variants.ts') || /tv\s*\(/.test(content);
                })
                .map(f => path.basename(f, '.ts'));
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Variant') => {
            const rows = exports.map((e) => `| \`${e}\` |  | \`@/styles/${_domain}\` |`).join('\n');
            return `| ${kind} / Token | Purpose | Import Path |\n|-----------------|---------|-------------|\n${rows}`;
        },
        checkBarrel: false, // Different logic for styles
    },
    {
        name: 'Library',
        baseDir: path.join(ROOT, 'lib'),
        getDomains: () => fs.readdirSync(path.join(ROOT, 'lib'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name),
        getExports: (domainPath: string) => {
            // Exclude any index.ts at any depth to avoid false positives
            return globbySync(['**/*.ts', '!index.ts', '!**/*.test.ts', '!**/index.ts'], { cwd: domainPath })
                .map(f => f.replace(/\\/g, '/').replace(/\.ts$/, ''));
        },
        buildReadmeTable: (exports: string[], _domain: string) => {
            const rows = exports.map((e) => `| \`${e}\` |  | \`@/lib/${_domain}\` |`).join('\n');
            return `| Utility / Module | Purpose | Import Path |\n|------------------|---------|-------------|\n${rows}`;
        },
        checkBarrel: true,
    },
    {
        name: 'Types',
        baseDir: path.join(ROOT, 'types'),
        getDomains: () => fs.readdirSync(path.join(ROOT, 'types'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name),
        getExports: (domainPath: string) => {
            // Multi-level barrel aware:
            // - Include top-level .ts and .d.ts files (excluding index.ts and tests)
            // - Normalize names so `openapi.d.ts` becomes `openapi`
            // - Include immediate subdirectory names (treated as sub-barrels)
            const topFiles = globbySync(['*.ts', '*.d.ts', '!index.ts', '!*.test.ts'], { cwd: domainPath })
                .map(f => path.basename(f))
                .map(name => name.replace(/\.d\.ts$/i, '').replace(/\.ts$/i, ''));

            const subdirs = fs.readdirSync(domainPath, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);

            return Array.from(new Set([...topFiles, ...subdirs]));
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Type') => {
            // If the domain has a root barrel (index.ts), prefer importing from the domain root.
            // Otherwise, direct consumers to subpath imports for each entry.
            const indexPath = path.join(ROOT, 'types', _domain, 'index.ts');
            const hasRootBarrel = fs.existsSync(indexPath);

            const rows = exports.map((e) => {
                const importPath = hasRootBarrel ? `@/types/${_domain}` : `@/types/${_domain}/${e}`;
                return `| \`${e}\` |  | \`${importPath}\` |`;
            }).join('\n');
            return `| ${kind} / Schema | Purpose | Import Path |\n|---------------|---------|-------------|\n${rows}`;
        },
        checkBarrel: true,
    },
    {
        name: 'Unit Tests',
        baseDir: path.join(ROOT, 'tests/unit'),
        getDomains: () => {
            const unitDir = path.join(ROOT, 'tests/unit');
            if (!fs.existsSync(unitDir)) return [];
            return fs.readdirSync(unitDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
        },
        getExports: (domainPath: string) => {
            const testFiles = globbySync(['**/*.test.ts', '**/*.test.tsx'], { cwd: domainPath });
            return testFiles.map(f => {
                const testName = path.basename(f).replace(/\.test\.(ts|tsx)$/, '');
                return testName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Unit') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind} test |  |`).join('\n');
            return `| Test File | Type | Description |\n|-----------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Integration Tests',
        baseDir: path.join(ROOT, 'tests/integration'),
        getDomains: () => {
            const intDir = path.join(ROOT, 'tests/integration');
            if (!fs.existsSync(intDir)) return [];
            return fs.readdirSync(intDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
        },
        getExports: (domainPath: string) => {
            const testFiles = globbySync(['**/*.test.ts', '**/*.test.tsx'], { cwd: domainPath });
            return testFiles.map(f => {
                const testName = path.basename(f).replace(/\.test\.(ts|tsx)$/, '');
                const subDir = path.dirname(f) !== '.' ? `${path.dirname(f)}/` : '';
                return `${subDir}${testName}`;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Integration') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind} test |  |`).join('\n');
            return `| Test File | Type | Description |\n|-----------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Component Tests',
        baseDir: path.join(ROOT, 'tests/components'),
        getDomains: () => {
            const compDir = path.join(ROOT, 'tests/components');
            if (!fs.existsSync(compDir)) return [];
            return fs.readdirSync(compDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
        },
        getExports: (domainPath: string) => {
            const testFiles = globbySync(['**/*.test.tsx'], { cwd: domainPath });
            return testFiles.map(f => {
                const testName = path.basename(f).replace(/\.test\.tsx$/, '');
                return testName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Component') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind} test |  |`).join('\n');
            return `| Test File | Type | Description |\n|-----------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Test Support',
        baseDir: path.join(ROOT, 'tests/support'),
        getDomains: () => {
            const supportDir = path.join(ROOT, 'tests/support');
            if (!fs.existsSync(supportDir)) return [];
            return fs.readdirSync(supportDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
        },
        getExports: (domainPath: string) => {
            const supportFiles = globbySync(['**/*.ts', '**/*.tsx', '!**/*.test.*'], { cwd: domainPath });
            return supportFiles.map(f => {
                const fileName = path.basename(f).replace(/\.(ts|tsx)$/, '');
                return fileName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Support') => {
            const rows = exports.map((s) => `| \`${s}\` | Test ${kind.toLowerCase()} |  |`).join('\n');
            return `| ${kind} File | Type | Description |\n|-------------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Test Guards',
        baseDir: path.join(ROOT, 'tests/guards'),
        getDomains: () => [''], // Single directory, no subdirectories
        getExports: (domainPath: string) => {
            const guardFiles = globbySync(['**/*.test.ts', '**/*.test.tsx'], { cwd: domainPath });
            return guardFiles.map(f => {
                const testName = path.basename(f).replace(/\.test\.(ts|tsx)$/, '');
                return testName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Guard') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind} test |  |`).join('\n');
            return `| Test File | Type | Description |\n|-----------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Test Security',
        baseDir: path.join(ROOT, 'tests/security'),
        getDomains: () => [''], // Single directory, no subdirectories
        getExports: (domainPath: string) => {
            const securityFiles = globbySync(['**/*.test.ts', '**/*.test.tsx'], { cwd: domainPath });
            return securityFiles.map(f => {
                const testName = path.basename(f).replace(/\.test\.(ts|tsx)$/, '');
                return testName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Security') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind} test |  |`).join('\n');
            return `| Test File | Type | Description |\n|-----------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Test Styles',
        baseDir: path.join(ROOT, 'tests/styles'),
        getDomains: () => [''], // Single directory, no subdirectories
        getExports: (domainPath: string) => {
            const styleFiles = globbySync(['**/*.test.ts', '**/*.test.tsx'], { cwd: domainPath });
            return styleFiles.map(f => {
                const testName = path.basename(f).replace(/\.test\.(ts|tsx)$/, '');
                return testName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Style') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind} test |  |`).join('\n');
            return `| Test File | Type | Description |\n|-----------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Test Types',
        baseDir: path.join(ROOT, 'tests/types'),
        getDomains: () => [''], // Single directory, no subdirectories
        getExports: (domainPath: string) => {
            // Include both test files and type-only files
            const typeFiles = globbySync(['**/*.ts', '**/*.tsx'], { 
                cwd: domainPath,
                ignore: ['**/*.d.ts']
            });
            return typeFiles.map(f => {
                const fileName = path.basename(f).replace(/\.(ts|tsx)$/, '');
                return fileName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Type') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind} file |  |`).join('\n');
            return `| File | Type | Description |\n|------|------|-------------|\n${rows}`;
        },
        checkBarrel: false,
    },
    {
        name: 'Scripts',
        baseDir: path.join(ROOT, 'scripts'),
        getDomains: () => fs.readdirSync(path.join(ROOT, 'scripts'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name),
        getExports: (domainPath: string) => {
            // For scripts, we want to list the actual script files, not exports
            const scriptFiles = globbySync(['**/*.ts', '**/*.tsx', '**/*.mjs', '**/*.cjs'], { 
                cwd: domainPath,
                ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.spec.*']
            });
            return scriptFiles.map(f => {
                const fileName = path.basename(f).replace(/\.(ts|tsx|mjs|cjs)$/, '');
                return fileName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Script') => {
            // Use template-based approach for scripts
            const scriptData = generateScriptReadmeData(_domain, exports);
            return generateScriptReadme(scriptData);
        },
        checkBarrel: false, // Scripts don't have index barrels
    },
    {
        name: 'Tools',
        baseDir: path.join(ROOT, 'tools'),
        getDomains: () => fs.readdirSync(path.join(ROOT, 'tools'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name),
        getExports: (domainPath: string) => {
            // For tools, we want to list the actual tool files, not exports
            const toolFiles = globbySync(['**/*.ts', '**/*.tsx', '**/*.yml', '**/*.js', '**/*.json'], { 
                cwd: domainPath,
                ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.spec.*', '**/README.md']
            });
            return toolFiles.map(f => {
                const fileName = path.basename(f).replace(/\.(ts|tsx|yml|js|json)$/, '');
                return fileName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'Tool') => {
            const rows = exports.map((t) => `| \`${t}\` | ${kind.toLowerCase()} file | \`@/tools/${_domain}\``).join('\n');
            return `| ${kind} | Purpose | Import Path |\n|------|---------|-------------|\n${rows}`;
        },
        checkBarrel: false, // Tools don't have index barrels
    },
    {
        name: 'GitHub',
        baseDir: path.join(ROOT, '.github'),
        getDomains: () => fs.readdirSync(path.join(ROOT, '.github'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name),
        getExports: (domainPath: string) => {
            // For GitHub directories, we want to list the actual files, not exports
            const githubFiles = globbySync(['**/*.yml', '**/*.yaml', '**/*.ts', '**/*.sh', '**/*.md'], { 
                cwd: domainPath,
                ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.spec.*', '**/README.md']
            });
            return githubFiles.map(f => {
                const fileName = path.basename(f).replace(/\.(yml|yaml|ts|sh|md)$/, '');
                return fileName;
            });
        },
        buildReadmeTable: (exports: string[], _domain: string, kind: ReadmeKind = 'File') => {
            const rows = exports.map((g) => `| \`${g}\` | GitHub ${kind.toLowerCase()} | \`.github/${_domain}\``).join('\n');
            return `| ${kind} | Purpose | Location |\n|------|---------|----------|\n${rows}`;
        },
        checkBarrel: false, // GitHub directories don't have index barrels
    },
    // Styles handled earlier: single Styles config above (keep unique)
    {
        name: 'ESLint Plugin',
        baseDir: path.join(ROOT, 'eslint-plugin-corso'),
        getDomains: () => fs.readdirSync(path.join(ROOT, 'eslint-plugin-corso'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name),
        getExports: (domainPath: string) => {
            // For ESLint plugin directories, we want to list the actual files, not exports
            const pluginFiles = globbySync(['**/*.ts', '**/*.js', '**/*.yml', '**/*.yaml', '**/*.md', '**/*.json'], { 
                cwd: domainPath,
                ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.spec.*', '**/README.md', '**/dist/**', '**/build/**']
            });
            return pluginFiles.map(f => {
                const fileName = path.basename(f).replace(/\.(ts|js|yml|yaml|md|json)$/, '');
                return fileName;
            });
        },
        buildReadmeTable: (exports: string[], domain: string) => {
            const rows = exports.map((p) => `| \`${p}\` | Plugin file | \`eslint-plugin-corso/${domain}\``).join('\n');
            return `| File | Purpose | Location |\n|------|---------|----------|\n${rows}`;
        },
        checkBarrel: false, // ESLint plugin directories don't have index barrels
    }
];

function main() {
    let hasWarn = false;

    CONFIGS.forEach(config => {
        console.log(`\n--- Processing ${config.name} ---`);
        const domains = config.getDomains();

        domains.forEach(domain => {
            const domainPath = config.name === 'Contexts' || config.name === 'Actions' ? config.baseDir : path.join(config.baseDir, domain);
            const exports = config.getExports(domainPath);
            
            if (exports.length > 0) {
                const table = config.buildReadmeTable(exports, domain);
                const readmePath = (config.name === 'Contexts' || config.name === 'Actions') ? path.join(config.baseDir, 'README.md') : path.join(domainPath, 'README.md');
                updateReadme(readmePath, table);
                console.log(`Updated README for ${config.name}${domain ? '/' + domain : ''}`);
            }

            if (config.checkBarrel) {
                // Skip barrel completeness check for CSS-only tokens in Styles
                if (config.name === 'Styles' && path.basename(domainPath) === 'tokens') {
                    return;
                }
                // If a Types subdomain intentionally has no root barrel (no index.ts),
                // skip barrel checks to avoid false positives (e.g., types/validators).
                if (config.name === 'Types') {
                  const maybeIndex = path.join(domainPath, 'index.ts');
                  if (!fs.existsSync(maybeIndex)) {
                    return;
                  }
                }
                // No per-subfolder skip needed for Actions now that we are root-aware
                // For Components, the root barrel (e.g., components/ui/index.ts) re-exports nested barrels.
                // Recursively read nested barrels to avoid false positives.
                let barrelExports: string[];
                if (config.name === 'Components') {
                  barrelExports = readAllBarrelModules(domainPath);
                } else if (config.name === 'Actions') {
                  // Always check against the root actions barrel, include referenced modules (imports & re-exports)
                  const ref = readBarrelReferencedModules(path.join(ROOT, 'actions'));
                  barrelExports = Array.from(new Set([
                    ...readBarrelExports(path.join(ROOT, 'actions')),
                    ...(Array.isArray(ref.files) ? ref.files : []),
                  ]));
                } else if (config.name === 'Library') {
                  // Library domains often use nested barrels (e.g., lib/shared -> ./errors -> files)
                  barrelExports = readAllBarrelModules(domainPath);
                } else {
                  barrelExports = readBarrelExports(domainPath);
                }
                exports.forEach(e => {
                    const eBase = path.basename(e);
                    const exportName = eBase.endsWith('Provider') || eBase.startsWith('use') ? eBase.replace(/\.(tsx|ts)$/, '').replace(/-provider$/, 'Provider') : eBase;
                    const moduleName = exportName.replace('Provider', '-provider').toLowerCase();
                    // Skip internal files based on policy config
                    if (config.name === 'Library' && isInternalToPolicy(domainPath, e)) {
                      return;
                    }

                    // Context-aware match: consider nested exports such as 'subdir/types'
                    const covered = barrelExports.some(be => {
                      const norm = be.replace(/\\/g, '/');
                      return (
                        norm === eBase ||
                        norm === e ||
                        norm.endsWith(`/${eBase}`) ||
                        norm.startsWith(`${eBase}/`)
                      );
                    });

                    if (!covered && !barrelExports.includes(moduleName)) {
                      // Fallback fuzzy matching
                      const found = barrelExports.some(be => {
                        const slug = path.basename(be, path.extname(be));
                        const pattern = new RegExp(eBase.replace('Provider',''), 'i');
                        return pattern.test(slug.replace(/[-_]/g,''));
                      });
                      if (!found) {
                        console.warn(`[${config.name}] ${domain} -> ${e} missing from barrel export`);
                        hasWarn = true;
                      }
                    }
                });
            } else if (config.name === 'Contexts') {
                // Special handling for contexts: validate root barrel exports
                const rootBarrelPath = path.join(ROOT, 'contexts', 'index.ts');
                const rootBarrelExports = readContextsBarrelExports(path.join(ROOT, 'contexts'));
                
                exports.forEach(e => {
                    if (!rootBarrelExports.includes(e)) {
                        console.warn(`[${config.name}] Root barrel missing export: ${e}`);
                        hasWarn = true;
                    }
                });
            }
        });
    });

    if (hasWarn) process.exitCode = 1;
}

/**
 * Generate script README data for template rendering
 */
function generateScriptReadmeData(domain: string, exports: string[]) {
  const domainPath = path.join(ROOT, 'scripts', domain);
  const readmePath = path.join(domainPath, 'README.md');

  // Read existing README if it exists
  let existingContent = '';
  try {
    existingContent = fs.readFileSync(readmePath, 'utf8');
  } catch {
    // README doesn't exist, will be created
  }

  // Determine script type and purpose based on domain
  const scriptInfo = getScriptDomainInfo(domain);

  // Generate script inventory
  const scripts = exports.map(scriptName => {
    const scriptPath = path.join(domainPath, `${scriptName}.ts`);
    let purpose = 'Script utility';
    let execution = 'pnpm tsx';

    // Determine purpose and execution based on file patterns
    if (scriptName.includes('check-') || scriptName.includes('validate-')) {
      purpose = 'Validation and quality check script';
      execution = 'pnpm tsx';
    } else if (scriptName.includes('generate-') || scriptName.includes('create-')) {
      purpose = 'Code generation and scaffolding script';
      execution = 'pnpm tsx';
    } else if (scriptName.includes('analyze-') || scriptName.includes('audit-')) {
      purpose = 'Analysis and reporting script';
      execution = 'pnpm node';
    } else if (scriptName.includes('fix-') || scriptName.includes('update-')) {
      purpose = 'Automated refactoring and maintenance script';
      execution = 'pnpm tsx';
    }

    return {
      file: scriptName,
      type: 'TypeScript',
      purpose,
      execution
    };
  });

  return {
    title: `${scriptInfo.title}`,
    description: scriptInfo.description,
    domain,
    exports,
    scripts,
    overview: scriptInfo.overview,
    quick_start: scriptInfo.quick_start,
    usage_examples: scriptInfo.usage_examples,
    ci_examples: scriptInfo.ci_examples,
    dev_examples: scriptInfo.dev_examples,
    precommit_examples: scriptInfo.precommit_examples,
    performance: scriptInfo.performance,
    dependencies: scriptInfo.dependencies,
    related_docs: scriptInfo.related_docs,
    last_updated: new Date().toISOString().slice(0, 10),
    category: 'automation'
  };
}

/**
 * Generate script README using template
 */
function generateScriptReadme(data: any): string {
  const templatePath = path.join(__dirname, '../docs/templates/README.scripts.md');

  try {
    let template = fs.readFileSync(templatePath, 'utf8');

    // Simple template replacement
    template = template.replace(/\{\{title\}\}/g, data.title);
    template = template.replace(/\{\{description\}\}/g, data.description);
    template = template.replace(/\{\{last_updated\}\}/g, data.last_updated);
    template = template.replace(/\{\{category\}\}/g, data.category);
    template = template.replace(/\{\{domain\}\}/g, data.domain);

    // Handle arrays
    template = template.replace(/\{\{#exports\}\}[\s\S]*?\{\{\/exports\}\}/g, () => {
      return data.exports.map((name: string) => `| \`${name}\` | script file | \`@/scripts/${data.domain}\` |`).join('\n');
    });

    template = template.replace(/\{\{#scripts\}\}[\s\S]*?\{\{\/scripts\}\}/g, () => {
      return data.scripts.map((script: any) =>
        `| \`${script.file}\` | ${script.type} | ${script.purpose} | \`${script.execution}\` |`
      ).join('\n');
    });

    // Handle simple string replacements
    template = template.replace(/\{\{overview\}\}/g, data.overview);
    template = template.replace(/\{\{quick_start\}\}/g, data.quick_start);
    template = template.replace(/\{\{usage_examples\}\}/g, data.usage_examples);
    template = template.replace(/\{\{performance\}\}/g, data.performance);
    template = template.replace(/\{\{dependencies\}\}/g, data.dependencies);
    template = template.replace(/\{\{related_docs\}\}/g, data.related_docs);

    // Handle array replacements
    template = template.replace(/\{\{#ci_examples\}\}[\s\S]*?\{\{\/ci_examples\}\}/g, () => {
      return data.ci_examples.map((example: string) => `${example}`).join('\n');
    });

    template = template.replace(/\{\{#dev_examples\}\}[\s\S]*?\{\{\/dev_examples\}\}/g, () => {
      return data.dev_examples.map((example: string) => `${example}`).join('\n');
    });

    template = template.replace(/\{\{#precommit_examples\}\}[\s\S]*?\{\{\/precommit_examples\}\}/g, () => {
      return data.precommit_examples.map((example: string) => `${example}`).join('\n');
    });

    return template;
  } catch (error) {
    console.warn(`Warning: Could not read template ${templatePath}, using simple format`);
    return generateSimpleScriptReadme(data);
  }
}

/**
 * Generate simple script README when template is not available
 */
function generateSimpleScriptReadme(data: any): string {
  let readme = `---
title: "${data.title}"
description: "${data.description}"
last_updated: '${data.last_updated}'
category: ${data.category}
---

## Public Exports
| Script | Purpose | Import Path |
|--------|---------|-------------|
`;

  data.exports.forEach((name: string) => {
    readme += `| \`${name}\` | script file | \`@/scripts/${data.domain}\` |\n`;
  });

  readme += `

## ${data.title} Overview

${data.overview}

## 📁 Script Inventory

| Script | Type | Purpose | Execution |
|--------|------|---------|-----------|
`;

  data.scripts.forEach((script: any) => {
    readme += `| \`${script.file}\` | ${script.type} | ${script.purpose} | \`${script.execution}\` |\n`;
  });

  readme += `

## 🚀 Quick Start

${data.quick_start}

## Usage Examples

${data.usage_examples}

---

_Last updated: ${data.last_updated}_
`;

  return readme;
}

/**
 * Get script domain information based on domain name
 */
function getScriptDomainInfo(domain: string): {
  title: string;
  description: string;
  overview: string;
  quick_start: string;
  usage_examples: string;
  ci_examples: string[];
  dev_examples: string[];
  precommit_examples: string[];
  performance: string;
  dependencies: string;
  related_docs: string;
} {
  const domainInfo: Record<string, any> = {
    'analysis': {
      title: 'Analysis Scripts',
      description: 'Codebase analysis tools for dependency management, unused code detection, and duplication analysis.',
      overview: 'Specialized scripts for maintaining codebase health through automated analysis of dependencies, unused code, and code duplication patterns.',
      quick_start: 'Run dependency analysis: `pnpm node scripts/analysis/analyze-knip-baseline.cjs --all`',
      usage_examples: 'See individual script documentation for detailed usage patterns.',
      ci_examples: ['pnpm node scripts/analysis/analyze-knip-baseline.cjs --all'],
      dev_examples: ['pnpm node scripts/analysis/analyze-unused-exports.cjs'],
      precommit_examples: ['pnpm node scripts/analysis/analyze-knip-baseline.cjs --fast'],
      performance: 'Analysis scripts typically run in 10-60 seconds depending on scope.',
      dependencies: 'Node.js built-ins, globby, TypeScript compiler API',
      related_docs: 'See [CI Scripts](../ci/) and [Maintenance Scripts](../maintenance/) for related tooling.'
    },
    'ci': {
      title: 'CI Scripts',
      description: 'Quality gates, validation, and automated checks for CI/CD pipelines.',
      overview: 'Scripts for CI/CD validation, quality gates, and automated checks ensuring code quality and architectural integrity.',
      quick_start: 'Run quality gates: `pnpm tsx scripts/ci/quality-gates-local.ts`',
      usage_examples: 'See individual script documentation for detailed usage patterns.',
      ci_examples: ['pnpm tsx scripts/ci/quality-gates-local.ts', 'pnpm tsx scripts/ci/check-bundle-size.ts'],
      dev_examples: ['pnpm tsx scripts/ci/validate-cursor-rules.ts'],
      precommit_examples: ['pnpm tsx scripts/ci/check-protected-auth.ts'],
      performance: 'CI checks typically run in 5-30 seconds.',
      dependencies: 'Node.js built-ins, globby, TypeScript compiler',
      related_docs: 'See [Quality Gates](../../docs/cicd-workflow/quality-gates.md) documentation.'
    },
    'lint': {
      title: 'Lint Scripts',
      description: 'Comprehensive automated linting, validation, and quality assurance tools.',
      overview: 'Scripts for comprehensive code quality validation and security scanning including accessibility, performance, and standards compliance.',
      quick_start: 'Run security audit: `pnpm tsx scripts/lint/audit-ai-security.ts`',
      usage_examples: 'See individual script documentation for detailed usage patterns.',
      ci_examples: ['pnpm tsx scripts/lint/audit-ai-security.ts', 'pnpm tsx scripts/lint/check-edge-compat.ts'],
      dev_examples: ['pnpm tsx scripts/lint/verify-ai-tools.ts'],
      precommit_examples: ['pnpm tsx scripts/lint/check-protected-auth.ts'],
      performance: 'Lint scripts typically run in 5-30 seconds.',
      dependencies: 'Node.js built-ins, globby, accessibility analyzers',
      related_docs: 'See [Code Quality](../../docs/code-quality-standards.md) documentation.'
    },
    'maintenance': {
      title: 'Maintenance Scripts',
      description: 'Documentation and system maintenance automation tools.',
      overview: 'Scripts for documentation generation, barrel file management, and ongoing system maintenance including README updates and link validation.',
      quick_start: 'Generate documentation: `pnpm tsx scripts/maintenance/enhance-readmes.ts`',
      usage_examples: 'See individual script documentation for detailed usage patterns.',
      ci_examples: ['pnpm tsx scripts/maintenance/validate-docs.ts'],
      dev_examples: ['pnpm tsx scripts/maintenance/audit-barrels.ts'],
      precommit_examples: ['pnpm tsx scripts/maintenance/validate-docs.ts'],
      performance: 'Maintenance scripts typically run in 5-120 seconds.',
      dependencies: 'Node.js built-ins, globby, frontmatter parsers',
      related_docs: 'See [Documentation Standards](../../docs/README.md) for maintenance guidelines.'
    },
    'setup': {
      title: 'Setup Scripts',
      description: 'Development environment setup, validation, and workflow automation.',
      overview: 'Scripts for environment setup, validation, and development workflow optimization ensuring consistent development environments.',
      quick_start: 'Setup development: `pnpm tsx scripts/setup/setup-branch.ts`',
      usage_examples: 'See individual script documentation for detailed usage patterns.',
      ci_examples: ['pnpm tsx scripts/setup/validate-env.ts'],
      dev_examples: ['pnpm tsx scripts/setup/validate-env.ts'],
      precommit_examples: ['pnpm tsx scripts/setup/validate-env.ts'],
      performance: 'Setup scripts typically run in 2-10 seconds.',
      dependencies: 'Node.js built-ins, child_process for system commands',
      related_docs: 'See [Development Environment](../../docs/dev-environment.md) documentation.'
    },
    'validation': {
      title: 'Validation Scripts',
      description: 'Runtime and integration validation tools.',
      overview: 'Scripts for runtime boundary enforcement, link validation, and integration testing ensuring system integrity.',
      quick_start: 'Validate links: `pnpm tsx scripts/validation/validate-links.ts`',
      usage_examples: 'See individual script documentation for detailed usage patterns.',
      ci_examples: ['pnpm tsx scripts/validation/lib-structure.ts'],
      dev_examples: ['pnpm tsx scripts/validation/validate-links.ts'],
      precommit_examples: ['pnpm tsx scripts/validation/lib-structure.ts'],
      performance: 'Validation scripts typically run in 2-10 seconds.',
      dependencies: 'Node.js built-ins, globby for file scanning',
      related_docs: 'See [Runtime Boundaries](../codebase/cursor-rules.md) documentation.'
    }
  };

  return domainInfo[domain] || {
    title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Scripts`,
    description: `Scripts for ${domain} automation and maintenance.`,
    overview: `Specialized scripts for ${domain} operations.`,
    quick_start: 'See individual script documentation for usage.',
    usage_examples: 'See individual script documentation for detailed usage patterns.',
    ci_examples: [],
    dev_examples: [],
    precommit_examples: [],
    performance: 'Performance varies by script type.',
    dependencies: 'Node.js built-ins and common utilities',
    related_docs: 'See related script domains for additional tooling.'
  };
}

main();

