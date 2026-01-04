#!/usr/bin/env tsx
// scripts/manage-docs.ts
// A unified tool for managing documentation: indexing, TOC generation, and metric updates.

import { glob } from 'glob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { COMMON_IGNORE_GLOBS } from '../utils/constants';
import { replaceBetweenMarkers, writeIfChangedAtomic } from './maintenance-common';

// --- Logic from gen-docs-index.ts ---
async function generateDocsIndex() {
  console.log('Generating docs/index.ts...');

  // Normalize paths case-insensitively and with / separators
  const norm = (p: string) => path.normalize(p).replace(/\\/g, '/').toLowerCase();

  // Fix for Windows glob issues: collect README files from specific directories
  const docFiles: string[] = [];

  // Common ignore patterns for all glob calls
  const commonIgnore = [...COMMON_IGNORE_GLOBS, 'test-reports/**'];

  // Get root-level README files
  const rootReadmes = await glob('*/README.md', {
    ignore: commonIgnore,
  });
  docFiles.push(...rootReadmes);

  // Get lib directory README files (Windows-compatible)
  const libReadmes = await glob('lib/**/README.md', { ignore: commonIgnore });
  docFiles.push(...libReadmes);

  // Get tests directory README files (Windows-compatible)
  const testReadmes = await glob('tests/**/README.md', { ignore: commonIgnore });
  docFiles.push(...testReadmes);

  // Get types directory README files (Windows-compatible)
  const typesReadmes = await glob('types/**/README.md', { ignore: commonIgnore });
  docFiles.push(...typesReadmes);

  // Get components directory README files (Windows-compatible)
  const componentsReadmes = await glob('components/**/README.md', { ignore: commonIgnore });
  docFiles.push(...componentsReadmes);

  // Get contexts directory README files (Windows-compatible)
  const contextsReadmes = await glob('contexts/**/README.md', { ignore: commonIgnore });
  docFiles.push(...contextsReadmes);

  // Get hooks directory README files (Windows-compatible)
  const hooksReadmes = await glob('hooks/**/README.md', { ignore: commonIgnore });
  // Exclude hooks/shared sub-READMEs; we only keep the root consolidated README
  docFiles.push(...hooksReadmes.filter(p => !p.replace(/\\/g, '/').includes('hooks/shared/') || p.endsWith('hooks/shared/README.md')));

  // Get styles directory README files (Windows-compatible)
  const stylesReadmes = await glob('styles/**/README.md', { ignore: commonIgnore });
  docFiles.push(...stylesReadmes);

  // Get app directory README files (Windows-compatible)
  const appReadmes = await glob('app/**/README.md', { ignore: commonIgnore });
  docFiles.push(...appReadmes);

  // Get scripts directory README files (Windows-compatible)
  const scriptsReadmes = await glob('scripts/**/README.md', { ignore: commonIgnore });
  docFiles.push(...scriptsReadmes);

  // Get docs directory README files (Windows-compatible)
  const docsReadmes = await glob('docs/**/README.md', { ignore: commonIgnore });
  docFiles.push(...docsReadmes);

  // Get dot-directories README files explicitly (Windows-compatible)
  const cursorReadmes = await glob('.cursor/**/README.md', { ignore: commonIgnore });
  docFiles.push(...cursorReadmes);

  const githubReadmes = await glob('.github/**/README.md', { ignore: commonIgnore });
  docFiles.push(...githubReadmes);

  const vscodeReadmes = await glob('.vscode/**/README.md', { ignore: commonIgnore });
  docFiles.push(...vscodeReadmes);

  // Additional top-level workspaces/dirs
  const eslintPluginReadmes = await glob('eslint-plugin-corso/**/README.md', { ignore: commonIgnore });
  docFiles.push(...eslintPluginReadmes);

  const toolsReadmes = await glob('tools/**/README.md', { ignore: commonIgnore });
  docFiles.push(...toolsReadmes);

  const supabaseReadmes = await glob('supabase/**/README.md', { ignore: commonIgnore });
  docFiles.push(...supabaseReadmes);

  // Get .husky directory README files (explicit dotdir include)
  const huskyReadmes = await glob('.husky/**/README.md', { ignore: commonIgnore });
  docFiles.push(...huskyReadmes);

  // Get other root-level README files that might be missed
  const otherReadmes = await glob('**/README.md', {
    ignore: [
      ...commonIgnore,
      // Exclude directories already explicitly counted above
      'lib/**',
      'tests/**',
      'types/**',
      'components/**',
      'contexts/**',
      'hooks/**',
      'styles/**',
      'app/**',
      'scripts/**',
      'docs/**',
      '.cursor/**',
      '.github/**',
      '.vscode/**',
      '.husky/**',
      'eslint-plugin-corso/**',
      'tools/**',
      'supabase/**',
    ],
  });
  docFiles.push(...otherReadmes);

  // Normalize and deduplicate file paths
  const normalizedSet = new Set(docFiles.map(norm));
  const uniqueFiles = [...normalizedSet].map(normalized =>
    docFiles.find(p => norm(p) === normalized) || normalized
  ).sort((a, b) => norm(a).localeCompare(norm(b)));

  // Exclude ephemeral/build directories globally
  const EXCLUDED_SEGMENTS = new Set([
    'node_modules', '.next', 'dist', 'coverage', 'reports',
    '.typegen', 'tmp', '.turbo', '.vite', 'out', 'build', '.cache'
  ]);
  const filteredFiles = uniqueFiles.filter((p) => {
    const parts = p.split(/[/\\]/g);
    return !parts.some((seg) => EXCLUDED_SEGMENTS.has(seg));
  });

  const found = docFiles.length;
  const unique = uniqueFiles.length;
  const filtered = filteredFiles.length;

  console.log(`Found ${found} README files total:`);
  console.log(`  Root level: ${rootReadmes.length}`);
  console.log(`  Lib: ${libReadmes.length}`);
  console.log(`  Tests: ${testReadmes.length}`);
  console.log(`  Types: ${typesReadmes.length}`);
  console.log(`  Components: ${componentsReadmes.length}`);
  console.log(`  Contexts: ${contextsReadmes.length}`);
  console.log(`  Hooks: ${hooksReadmes.length}`);
  console.log(`  Styles: ${stylesReadmes.length}`);
  console.log(`  App: ${appReadmes.length}`);
  console.log(`  Scripts: ${scriptsReadmes.length}`);
  console.log(`  Docs: ${docsReadmes.length}`);
  console.log(`  Husky: ${huskyReadmes.length}`);
  console.log(`  Cursor: ${cursorReadmes.length}`);
  console.log(`  GitHub: ${githubReadmes.length}`);
  console.log(`  VSCode: ${vscodeReadmes.length}`);
  console.log(`  ESLintPlugin: ${eslintPluginReadmes.length}`);
  console.log(`  Tools: ${toolsReadmes.length}`);
  console.log(`  Supabase: ${supabaseReadmes.length}`);
  console.log(`  Other: ${otherReadmes.length}`);

  const metadata: Array<{path: string, title: string} | null> = [];

  for (let i = 0; i < filteredFiles.length; i++) {
    const file = filteredFiles[i];
    if (!file) continue;

    try {
      const content = await fs.readFile(file, 'utf8');
      // Prefer frontmatter title: title: "..."
      let title: string | undefined;
      const fmTitle = content.match(/^title:\s*"([^"]+)"/m) || content.match(/^title:\s*'([^']+)'/m) || content.match(/^title:\s*(.+)$/m);
      if (fmTitle && fmTitle[1]) {
        title = fmTitle[1].trim();
      } else {
        const h1 = content.match(/^#\s+(.+)/m);
        title = h1?.[1]?.trim();
      }
      metadata.push({
        path: norm(file),
        title: title && title.length > 0 ? title : path.basename(file, '.md'),
      });
    } catch (error) {
      console.warn(`Warning: Could not read ${file}:`, error);
      metadata.push(null);
    }
  }

  // Filter out null entries (files that failed to read)
  const validMetadata = metadata.filter(Boolean);


  // Include non-README docs that must be indexed (hand-maintained allowlist)
  const extraDocs = [
    ['docs', 'security', 'dependency-policy.md'],
    ['docs', 'ci', 'renovate.md'],
  ];
  for (const parts of extraDocs) {
    try {
      const p = path.join(...parts);
      const content = await fs.readFile(p, 'utf8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const normalizedPath = norm(p);
      // Check if already exists in filteredFiles or validMetadata
      const alreadyInFiltered = filteredFiles.some(file => norm(file) === normalizedPath);
      const exists = validMetadata.some(m => m && m.path === normalizedPath);
      if (!alreadyInFiltered && !exists) {
        validMetadata.push({ path: normalizedPath, title: titleMatch?.[1] ?? parts.at(-1)!.replace('.md', '') });
      }
    } catch {
      // optional; ignore if missing
    }
  }

  const written = validMetadata.length;

  // Validate counts and throw error if we lost entries during processing
  if (written < filtered || found < filtered) {
    console.error('❌ Docs index validation failed:');
    console.error(`   Found: ${found}, Filtered: ${filtered}, Written: ${written}`);

    if (found < filtered) {
      console.error('   Issue: Found count is less than filtered count (data loss during processing)');
    }
    if (written < filtered) {
      console.error('   Issue: Written count is less than filtered count (metadata generation issue)');
    }

    throw new Error('Docs index validation failed due to count mismatch');
  }

  // Allow extra entries (e.g., from extraDocs) but ensure we have at least the filtered count
  if (written >= filtered) {
    console.log(`✅ Docs index validation passed: ${written} entries written`);
  }

  const indexContent = `// Generated by scripts/manage-docs.ts. Do not edit.\nexport const docs = ${JSON.stringify(
    validMetadata,
    null,
    2
  )} as const;\n`;
  // Atomic write, diff-before-write
  await writeIfChangedAtomic('docs/index.ts', indexContent);
  console.log(`✅ Updated docs/index.ts with ${written} entries (idempotent).`);
}

// --- Logic from rebuild-docs-readme.ts ---
async function generateDocsToc() {
  console.log('Generating docs/README.md table of contents...');
  // This function can be a combination of logic from rebuild-docs-readme.ts
  // and the README-updating part of gen-docs-index.ts
  // For now, we'll keep it simple.
  const docFiles = await glob('docs/**/*.md', { ignore: ['docs/README.md'] });
  const tocLines = docFiles.map(file => `- [${path.basename(file, '.md')}](${path.relative('docs', file)})`);
  const toc = `## Table of Contents\n\n${tocLines.join('\n')}\n`;
  // Inject between markers to avoid append storms
  try {
    const readmePath = path.join('docs', 'README.md');
    const current = await fs.readFile(readmePath, 'utf8');
    const next = replaceBetweenMarkers(current, 'docs-index', toc);
    await writeIfChangedAtomic(readmePath, next);
    console.log('✅ Updated docs/README.md TOC (idempotent).');
  } catch (err) {
    console.warn('ℹ️ Skipped TOC injection (markers missing?):', (err as Error).message);
  }
}

// --- Logic from generate-ui-readme.ts ---
async function generateUiReadme() {
    console.log('Generating UI components README...');
    const uiPath = path.join('components', 'ui');
    const atoms = (await glob('components/ui/atoms/*.tsx')).length;
    const molecules = (await glob('components/ui/molecules/*.tsx')).length;
    const organisms = (await glob('components/ui/organisms/*.tsx')).length;

    const content = `# UI Library\n\n- Atoms: ${atoms}\n- Molecules: ${molecules}\n- Organisms: ${organisms}\n`;
    await fs.writeFile(path.join(uiPath, 'README.md'), content);
    console.log(`✅ Generated README for UI components.`);
}

// --- Logic from update-readme-counts.ts ---
async function updateReadmeCounts() {
  console.log('Updating counts in main README.md...');
  const tests = (await glob('**/*.test.ts')).length;

  let readmeContent = await fs.readFile('README.md', 'utf8');
  readmeContent = readmeContent.replace(/(Test Matrix \()\d+/g, `Test Matrix (${tests}`);

  await fs.writeFile('README.md', readmeContent);
  console.log('✅ Updated counts in README.md.');
}


// --- Main CLI Orchestrator ---
async function main(commandArg?: string) {
  const command = commandArg ?? process.argv[2];

  if (!command) {
    console.error('Please specify a command: index, toc, ui-readme, counts, or all.');
    throw new Error('No command specified');
  }

  console.log(`Executing command: ${command}`);

  switch (command) {
    case 'index':
      await generateDocsIndex();
      break;
    case 'toc':
      await generateDocsToc();
      break;

    case 'ui-readme':
        await generateUiReadme();
        break;

    case 'counts':
        await updateReadmeCounts();
        break;
    case 'all':
      await Promise.all([generateDocsIndex(), generateDocsToc(), generateUiReadme(), updateReadmeCounts()]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      throw new Error(`Unknown command: ${command}`);
  }

  console.log('✅ Doc management script finished successfully.');
}

// ES module equivalent of require.main === module
// tsx provides import.meta.main, otherwise always run for CLI scripts
if (typeof import.meta.main === 'undefined' || import.meta.main) {
  main().catch(err => {
    console.error('❌ Script failed:', (err as Error).message);
    process.exit(1);
  });
}

export async function runCli(command?: string) {
  await main(command);
}

