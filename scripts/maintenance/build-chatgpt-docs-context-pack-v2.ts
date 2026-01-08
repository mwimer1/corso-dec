#!/usr/bin/env node
/**
 * Build ChatGPT Docs Deep Research Context Pack (v2)
 * 
 * Creates a comprehensive zip of docs, governance files, CI configs, and cursor rules
 * for ChatGPT Deep Research context, excluding the full scripts directory.
 */

import { existsSync, statSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { cp, mkdir, readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { join, dirname, relative, basename, resolve } from 'node:path';
import { globby } from 'globby';
import { createWriteStream } from 'node:fs';
import archiver from 'archiver';

const ROOT = process.cwd();
const V1_DIR = join(ROOT, '.tmp', 'chatgpt-docs-context-pack');
const V2_DIR = join(ROOT, '.tmp', 'chatgpt-docs-context-pack-v2');
const ZIP_PATH = join(ROOT, '.tmp', 'chatgpt-docs-context-pack-v2.zip');

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_SCRIPT_FILE_SIZE = 200 * 1024; // 200KB for targeted script files

interface FileEntry {
  path: string;
  status: 'COPIED' | 'MISSING' | 'SKIPPED_LARGE';
  bytes: number;
}

const manifest: FileEntry[] = [];
let totalFiles = 0;
let totalBytes = 0;
const missingFiles: string[] = [];
const skippedLarge: string[] = [];

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function copyFile(src: string, dest: string): Promise<boolean> {
  try {
    if (!existsSync(src)) {
      missingFiles.push(relative(ROOT, src));
      manifest.push({ path: relative(V2_DIR, dest), status: 'MISSING', bytes: 0 });
      return false;
    }

    const stats = statSync(src);
    if (stats.size > MAX_FILE_SIZE) {
      skippedLarge.push(relative(ROOT, src));
      manifest.push({ path: relative(V2_DIR, dest), status: 'SKIPPED_LARGE', bytes: stats.size });
      return false;
    }

    await ensureDir(dirname(dest));
    await cp(src, dest, { recursive: false });
    
    totalFiles++;
    totalBytes += stats.size;
    manifest.push({ path: relative(V2_DIR, dest), status: 'COPIED', bytes: stats.size });
    return true;
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error);
    return false;
  }
}

async function copyDirectory(src: string, dest: string, excludePatterns: string[] = []): Promise<void> {
  if (!existsSync(src)) {
    console.warn(`Source directory does not exist: ${src}`);
    return;
  }

  const entries = await readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    const relPath = relative(ROOT, srcPath);

    // Check exclude patterns
    if (excludePatterns.some(pattern => {
      if (pattern.includes('**')) {
        return relPath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''));
      }
      return relPath === pattern || relPath.startsWith(pattern + '/');
    })) {
      continue;
    }

    if (entry.isDirectory()) {
      await ensureDir(destPath);
      await copyDirectory(srcPath, destPath, excludePatterns);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}

async function copyV1IfExists() {
  if (existsSync(V1_DIR)) {
    console.log('Copying v1 contents...');
    await copyDirectory(V1_DIR, V2_DIR);
  }
}

async function copyDocs() {
  console.log('Copying docs/**...');
  const docsSrc = join(ROOT, 'docs');
  const docsDest = join(V2_DIR, 'docs');
  if (existsSync(docsSrc)) {
    await copyDirectory(docsSrc, docsDest);
  }
}

async function copyRootMarkdown() {
  console.log('Copying root *.md files...');
  const rootMdFiles = await globby('*.md', { cwd: ROOT, onlyFiles: true });
  for (const file of rootMdFiles) {
    const src = join(ROOT, file);
    const dest = join(V2_DIR, file);
    await copyFile(src, dest);
  }
}

async function copyConfigFiles() {
  console.log('Copying config files...');
  
  const configFiles = [
    'package.json',
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    'tsconfig.json',
  ];

  for (const file of configFiles) {
    const src = join(ROOT, file);
    if (existsSync(src)) {
      const dest = join(V2_DIR, file);
      await copyFile(src, dest);
    }
  }

  // Copy tsconfig.*.json files in root
  const tsconfigFiles = await globby('tsconfig.*.json', { cwd: ROOT, onlyFiles: true });
  for (const file of tsconfigFiles) {
    const src = join(ROOT, file);
    const dest = join(V2_DIR, file);
    await copyFile(src, dest);
  }

  // Copy eslint config files
  const eslintFiles = await globby(['eslint.config.*', '.eslintrc.*'], { cwd: ROOT, onlyFiles: true });
  for (const file of eslintFiles) {
    const src = join(ROOT, file);
    const dest = join(V2_DIR, file);
    await copyFile(src, dest);
  }

  // Copy prettier config files
  const prettierFiles = await globby(['prettier.*', '.prettierrc*', '.prettierignore'], { cwd: ROOT, onlyFiles: true });
  for (const file of prettierFiles) {
    const src = join(ROOT, file);
    const dest = join(V2_DIR, file);
    await copyFile(src, dest);
  }

  // Copy spell/style config files
  const spellStyleFiles = await globby([
    'cspell.json',
    '.cspell.json',
    '.markdownlint*',
    '.remarkrc*',
    'remark.config.*',
    '.vale.ini',
    'vale.ini',
  ], { cwd: ROOT, onlyFiles: true });
  for (const file of spellStyleFiles) {
    const src = join(ROOT, file);
    const dest = join(V2_DIR, file);
    await copyFile(src, dest);
  }

  // Copy vale/** directory if exists
  const valeDir = join(ROOT, 'vale');
  if (existsSync(valeDir)) {
    await copyDirectory(join(ROOT, 'vale'), join(V2_DIR, 'vale'));
  }
}

async function copyGitHub() {
  console.log('Copying .github/**...');
  const githubSrc = join(ROOT, '.github');
  const githubDest = join(V2_DIR, '.github');
  if (existsSync(githubSrc)) {
    await copyDirectory(githubSrc, githubDest);
  }
}

async function copyCursorRules() {
  console.log('Copying .cursor/rules/**...');
  const cursorRulesSrc = join(ROOT, '.cursor', 'rules');
  const cursorRulesDest = join(V2_DIR, '.cursor', 'rules');
  if (existsSync(cursorRulesSrc)) {
    await copyDirectory(cursorRulesSrc, cursorRulesDest);
  }
}

async function generateScriptsTreeSnapshot() {
  console.log('Generating scripts tree snapshot...');
  const scriptsDir = join(ROOT, 'scripts');
  if (!existsSync(scriptsDir)) {
    return '';
  }

  const allFiles: string[] = [];
  
  async function walk(dir: string, baseDir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        await walk(fullPath, baseDir);
      } else {
        allFiles.push(relPath.replace(/\\/g, '/'));
      }
    }
  }

  await walk(scriptsDir, scriptsDir);
  allFiles.sort();
  
  return allFiles.join('\n');
}

async function generateScriptsDocsRefs() {
  console.log('Generating scripts docs refs report...');
  const scriptsDir = join(ROOT, 'scripts');
  if (!existsSync(scriptsDir)) {
    return '';
  }

  const keywords = [
    'docs/',
    'README',
    'CHANGELOG',
    'markdown',
    'markdownlint',
    'remark',
    'vale',
    'cspell',
    'jscpd',
    'link-check',
    'linkinator',
    'markdown-link-check',
  ];

  const matches: Array<{ file: string; lines: string[] }> = [];
  const allScriptFiles = await globby(['**/*.{ts,tsx,js,jsx,mjs,mts}'], {
    cwd: scriptsDir,
    onlyFiles: true,
  });

  for (const relFile of allScriptFiles) {
    const fullPath = join(scriptsDir, relFile);
    try {
      const content = await readFile(fullPath, 'utf-8');
      const lines = content.split('\n');
      const matchingLines: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line && keywords.some(keyword => line.includes(keyword))) {
          matchingLines.push(`${i + 1}: ${line.trim()}`);
        }
      }
      
      if (matchingLines.length > 0) {
        matches.push({ file: relFile, lines: matchingLines });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  let output = 'Scripts Files with Docs/README/Markdown References\n';
  output += '='.repeat(60) + '\n\n';
  
  for (const match of matches) {
    output += `${match.file}\n`;
    output += '-'.repeat(60) + '\n';
    for (const line of match.lines) {
      output += `  ${line}\n`;
    }
    output += '\n';
  }
  
  return output;
}

async function copyTargetedScripts() {
  console.log('Copying targeted script files...');
  const scriptsDir = join(ROOT, 'scripts');
  if (!existsSync(scriptsDir)) {
    return;
  }

  const patterns = [
    'scripts/maintenance/docs/**/*.{ts,tsx}',
    'scripts/**/generate*readme*.{ts,tsx}',
    'scripts/**/docs*.{ts,tsx}',
    'scripts/**/markdown*.{ts,tsx}',
    'scripts/**/jscpd*.{ts,tsx}',
  ];

  const allMatches = await globby(patterns, { cwd: ROOT, onlyFiles: true });
  const uniqueFiles = [...new Set(allMatches)];

  for (const relFile of uniqueFiles) {
    const src = join(ROOT, relFile);
    if (!existsSync(src)) continue;

    const stats = statSync(src);
    if (stats.size > MAX_SCRIPT_FILE_SIZE) {
      skippedLarge.push(relFile);
      continue;
    }

    // Only copy files, not directories (globby should already filter, but double-check)
    if (!stats.isFile()) continue;

    const dest = join(V2_DIR, relFile);
    await copyFile(src, dest);
  }
}

async function generateTreeSnapshotDocs() {
  console.log('Generating docs tree snapshot...');
  const docsDir = join(ROOT, 'docs');
  if (!existsSync(docsDir)) {
    return '';
  }

  const allFiles = await globby('**/*', { cwd: docsDir, onlyFiles: true });
  allFiles.sort();
  return allFiles.join('\n');
}

async function generateRootMdList() {
  const rootMdFiles = await globby('*.md', { cwd: ROOT, onlyFiles: true });
  rootMdFiles.sort();
  return rootMdFiles.join('\n');
}

async function generateRootConfigList() {
  const configs: string[] = [];
  
  const configFiles = [
    'package.json',
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    'tsconfig.json',
  ];

  for (const file of configFiles) {
    if (existsSync(join(ROOT, file))) {
      configs.push(file);
    }
  }

  const additionalConfigs = await globby([
    'tsconfig.*.json',
    'eslint.config.*',
    '.eslintrc.*',
    'prettier.*',
    '.prettierrc*',
    '.prettierignore',
    'cspell.json',
    '.cspell.json',
    '.markdownlint*',
    '.remarkrc*',
    'remark.config.*',
    '.vale.ini',
    'vale.ini',
  ], { cwd: ROOT, onlyFiles: true });

  configs.push(...additionalConfigs);
  configs.sort();
  return configs.join('\n');
}

async function generateManifest() {
  return JSON.stringify(manifest, null, 2);
}

async function generateStats() {
  const stats = {
    total_files: totalFiles,
    total_bytes: totalBytes,
    missing_count: missingFiles.length,
    skipped_large_count: skippedLarge.length,
  };
  return JSON.stringify(stats, null, 2);
}

async function generateNote() {
  return `ChatGPT Docs Deep Research Context Pack (v2)
Generated: ${new Date().toISOString()}

This pack includes:
- Full docs/ directory
- Root governance files (package.json, lockfiles, configs)
- .github/ directory (CI/workflows)
- .cursor/rules/ directory (repo standards)
- Root markdown files
- Minimal targeted script files (docs-related only)
- Scripts tree snapshot and docs references report

NOTE: The full scripts directory is NOT included. Use the connected GitHub repo for complete scripts access.

Generated snapshots:
- SCRIPTS_TREE_SNAPSHOT.txt: Complete file tree under scripts/
- SCRIPTS_DOCS_REFS.txt: Scripts files referencing docs/README/markdown
- TREE_SNAPSHOT_DOCS.txt: Complete file tree under docs/
- ROOT_MD_LIST.txt: List of root *.md files
- ROOT_CONFIG_LIST.txt: List of key config files found
- MANIFEST.json: Complete manifest of copied files
- STATS.json: Summary statistics
`;
}

async function writeSnapshot(filename: string, content: string) {
  const dest = join(V2_DIR, filename);
  await writeFile(dest, content, 'utf-8');
}

async function createZip() {
  console.log('Creating zip file...');
  
  return new Promise<void>((resolve, reject) => {
    const output = createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zip created: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(V2_DIR, false);
    archive.finalize();
  });
}

async function main() {
  console.log('Building ChatGPT Docs Context Pack v2...\n');

  // Create v2 directory
  await ensureDir(V2_DIR);

  // Copy v1 contents if exists
  await copyV1IfExists();

  // Copy all required directories and files
  await copyDocs();
  await copyRootMarkdown();
  await copyConfigFiles();
  await copyGitHub();
  await copyCursorRules();

  // Handle scripts (snapshots + minimal files)
  await copyTargetedScripts();

  // Generate snapshots
  const scriptsTree = await generateScriptsTreeSnapshot();
  await writeSnapshot('SCRIPTS_TREE_SNAPSHOT.txt', scriptsTree);

  const scriptsDocsRefs = await generateScriptsDocsRefs();
  await writeSnapshot('SCRIPTS_DOCS_REFS.txt', scriptsDocsRefs);

  const docsTree = await generateTreeSnapshotDocs();
  await writeSnapshot('TREE_SNAPSHOT_DOCS.txt', docsTree);

  const rootMdList = await generateRootMdList();
  await writeSnapshot('ROOT_MD_LIST.txt', rootMdList);

  const rootConfigList = await generateRootConfigList();
  await writeSnapshot('ROOT_CONFIG_LIST.txt', rootConfigList);

  const manifestJson = await generateManifest();
  await writeSnapshot('MANIFEST.json', manifestJson);

  const statsJson = await generateStats();
  await writeSnapshot('STATS.json', statsJson);

  const note = await generateNote();
  await writeSnapshot('NOTE.txt', note);

  // Create zip
  await createZip();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`v2 folder path: ${V2_DIR}`);
  console.log(`zip path: ${ZIP_PATH}`);
  console.log(`total files copied: ${totalFiles}`);
  console.log(`total bytes: ${totalBytes.toLocaleString()}`);
  console.log(`missing files: ${missingFiles.length}`);
  if (missingFiles.length > 0) {
    missingFiles.forEach(f => console.log(`  - ${f}`));
  }
  console.log(`skipped_large: ${skippedLarge.length}`);
  if (skippedLarge.length > 0) {
    skippedLarge.forEach(f => console.log(`  - ${f}`));
  }
  console.log('\n✅ Ready to attach zip in Deep Research thread.');
}

main().catch((error) => {
  console.error('Error building context pack:', error);
  process.exit(1);
});
