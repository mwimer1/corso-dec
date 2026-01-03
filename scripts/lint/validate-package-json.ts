#!/usr/bin/env tsx
// scripts/lint/validate-package-json.ts

import { fileURLToPath } from 'node:url';
import { join } from 'path';
import { readTextSync } from '../utils/fs/read';
import { logger, createLintResult, resolveFromRepo } from './_utils';
import { hasStagedFiles, getCachedResult, saveCachedResult } from './_utils/cache';

interface ScriptKey {
  key: string;
  line: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

function main() {
  const packagePath = resolveFromRepo('package.json');
  
  // Performance optimization: Use cache if package.json not staged
  const isPackageStaged = hasStagedFiles(['package.json']);
  
  // If package.json is not staged, try to use cache
  if (!isPackageStaged) {
    const cached = getCachedResult('validate-package', [packagePath]);
    if (cached === true) {
      logger.success('✅ No duplicate scripts found in package.json (cached)');
      return; // Cache hit - skip validation
    }
    // If cached === false or null, we need to validate (package.json may have been fixed)
  }
  
  // Always validate if package.json is staged (it might have changed)
  // or if cache is invalid/missing

  const result = createLintResult();
  const packageContent = readTextSync(packagePath);
  const lines = packageContent.split('\n');
  const scriptKeys: ScriptKey[] = [];
  let inScriptsSection = false;

  lines.forEach((line, index) => {
    if (line.includes('"scripts"')) {
      inScriptsSection = true;
    } else if (inScriptsSection && /^\s*}\s*,?\s*$/.test(line)) {
      inScriptsSection = false;
    }

    if (inScriptsSection) {
      const match = line.match(/^\s*"([^"]+)":\s*"/);
      if (match && !match[1]?.startsWith('//')) {
        scriptKeys.push({
          key: match[1] ?? '',
          line: index + 1,
        });
      }
    }
  });

  const duplicates: { [key: string]: number[] } = {};
  scriptKeys.forEach((item) => {
    if (!duplicates[item.key]) {
      duplicates[item.key] = [];
    }
    duplicates[item.key]?.push(item.line);
  });

  Object.entries(duplicates).forEach(([key, lineNumbers]) => {
    if (lineNumbers.length > 1) {
      result.addError(`Duplicate script key "${key}" found on lines: ${lineNumbers.join(', ')}`);
    }
  });

  // Preserve original output format
  if (result.hasErrors()) {
    for (const error of result.getErrors()) {
      logger.error(`❌ ${error}`);
    }
    logger.error('\n⚠️  Please remove duplicate script definitions from package.json');
    
    // Cache the failure result
    saveCachedResult('validate-package', [packagePath], false);
    
    process.exitCode = 1;
  } else {
    logger.success('✅ No duplicate scripts found in package.json');
    
    // Cache the success result
    saveCachedResult('validate-package', [packagePath], true);
  }
}

main();

