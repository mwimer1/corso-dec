// scripts/maintenance/audit-barrels.ts
import { validateBarrelFile } from '@/scripts/utils/barrel-validation';
import fs, { readdirSync } from 'fs';
import path, { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
    checkDuplicateExports,
    detectBarrelMode,
    hasPlaceholderExports,
    readBarrelExports,
    shouldExcludeFromBarrelRequirements
} from './barrel-helpers';

// ESM-compatible __dirname/__filename polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = resolve(__dirname, '../..');
let exitCode = 0;

function parseTypedExports(content: string, filePath: string) {
  // Only run for types/ barrels - handle both Unix and Windows paths
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!normalizedPath.includes('/types/')) {
    return;
  }

  const duplicateIssues = checkDuplicateExports(content, filePath);

  for (const issue of duplicateIssues) {
    exitCode = 1;
    if (issue.type === 'duplicate') {
      console.error(`❌ Duplicate export of '${issue.symbol}' in ${filePath} (from ./${issue.from ?? 'unknown'}) at line ${issue.line + 1}`);
    } else {
      console.error(`❌ Symbol '${issue.symbol}' exported as both type and value in ${filePath} (from ./${issue.from ?? 'unknown'}) at line ${issue.line + 1}`);
    }
  }
}

function auditBarrelContent(filePath: string, content: string) {
  if (hasPlaceholderExports(content)) {
    exitCode = 1;
    console.error(`❌ Barrel file contains placeholder exports (z.any()): ${filePath}`);
  }
}

async function validateBarrelExports(filePath: string) {
  const content = await import('fs').then(fs => fs.readFileSync(filePath, 'utf-8'));

  parseTypedExports(content, filePath);
  auditBarrelContent(filePath, content);

  const validation = await validateBarrelFile(filePath, content);

  if (validation.hasDanglingExports) {
    for (const invalidExport of validation.invalidExports) {
      exitCode = 1;
      console.error(`❌ Dangling export in ${filePath}: Module './${invalidExport}' not found.`);
    }
  }

  // Mode-aware summary
  const mode = detectBarrelMode(filePath);
  if (mode === 'aggregator') {
    // ensure sub-barrels exist
    const dir = path.dirname(filePath);
    const modules = readBarrelExports(dir);
    const subBarrels = modules.filter(m => fs.existsSync(path.join(dir, m, 'index.ts')) || fs.existsSync(path.join(dir, m, 'index.tsx')));
    if (subBarrels.length > 0) {
      console.log(`ℹ️  ${filePath} detected as aggregator barrel (sub-barrels: ${subBarrels.join(', ')})`);
    }
  }
}

async function auditBarrelCompleteness(filePath: string) {
  const content = await import('fs').then(fs => fs.readFileSync(filePath, 'utf-8'));

  // Use shared utility for validation
  const validation = await validateBarrelFile(filePath, content);

  if (validation.hasMissingExports) {
    exitCode = 1;
    console.error(`❌ Incomplete barrel file ${filePath}. Missing exports:`);
    validation.missingModules.forEach((m: string) => console.error(`  - ${m}`));
  }
}

async function traverseAndValidate(dirPath: string) {
  const files = readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(dirPath, file.name);
    if (file.isDirectory()) {
        // Skip the refactored hooks/shared tree to avoid repopulating or auditing removed sub-barrels
        const normalized = fullPath.replace(/\\/g, '/');
        if (normalized.includes('/hooks/shared')) {
            continue;
        }
        if (file.name !== 'node_modules' && !file.name.startsWith('.')) {
            await traverseAndValidate(fullPath);
        }
    } else if (file.name === 'index.ts' || file.name === 'index.tsx') {
        // Skip validation for consolidated directories that no longer have index files
        if (shouldExcludeFromBarrelRequirements(fullPath)) {
            console.log(`⏭️  Skipping consolidated barrel: ${fullPath} (now consolidated in root hooks/index.ts)`);
            continue;
        }
        console.log(`🔎 Validating barrel: ${fullPath}`);
        await validateBarrelExports(fullPath);
        await auditBarrelCompleteness(fullPath);
    }
  }
}

async function main() {
    console.log('Validating and auditing all barrel files...');
    const directoriesToScan = [
        join(projectRoot, 'actions'),
        join(projectRoot, 'components'),
        join(projectRoot, 'lib'),
        join(projectRoot, 'hooks'),
        join(projectRoot, 'types'),
        join(projectRoot, 'styles'),
    ];

    for(const dir of directoriesToScan) {
        await traverseAndValidate(dir);
    }

    if (exitCode === 0) {
        console.log('✅ All barrel files are valid and complete.');
    } else {
        console.log('🔥 Barrel validation failed.');
    }

    process.exit(exitCode);
}

main().catch((error: unknown) => {
    console.error('Failed to validate barrels:', error);
    process.exit(1);
});

