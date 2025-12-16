#!/usr/bin/env tsx
// scripts/lint/validate-package-json.ts

import { fileURLToPath } from 'node:url';
import { join } from 'path';
import { readTextSync } from '../utils/fs/read';
import { logger } from '../utils/logger';

interface ScriptKey {
  key: string;
  line: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

function main() {
  const packagePath = join(__dirname, '..', '..', 'package.json');
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

  let hasDuplicates = false;
  Object.entries(duplicates).forEach(([key, lineNumbers]) => {
    if (lineNumbers.length > 1) {
      hasDuplicates = true;
      logger.error(`❌ Duplicate script key "${key}" found on lines: ${lineNumbers.join(', ')}`);
    }
  });

  if (hasDuplicates) {
    logger.error('\n⚠️  Please remove duplicate script definitions from package.json');
    process.exit(1);
  } else {
    logger.success('✅ No duplicate scripts found in package.json');
  }
}

main();

