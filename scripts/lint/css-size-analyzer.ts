#!/usr/bin/env tsx
/*
 * FILE: scripts/css-size-analyzer.ts
 *
 * Description: Analyzes the size of the generated CSS file and fails if it exceeds a threshold.
 *
 * Usage:
 *
 * pnpm run a11y:css-size
 */

import { fileURLToPath } from 'node:url';
import path from 'path';
import { readTextSync } from '../utils/fs/read';

const MAX_CSS_SIZE_KB = 150;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeCssSize() {
  const cssPath = path.join(process.cwd(), 'styles/build/tailwind.css');
  const css = readTextSync(cssPath);
  const sizeInKb = Buffer.byteLength(css, 'utf8') / 1024;

  console.log(`CSS size: ${sizeInKb.toFixed(2)} KB`);

  if (sizeInKb > MAX_CSS_SIZE_KB) {
    console.error(
      `❌ CSS size exceeds the maximum allowed size of ${MAX_CSS_SIZE_KB} KB.`,
    );
    process.exitCode = 1;
  } else {
    console.log(`✅ CSS size is within the allowed limit.`);
  }
}

analyzeCssSize();

