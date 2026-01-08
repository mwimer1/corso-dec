#!/usr/bin/env node
import { execSync } from 'node:child_process';

try {
  // Check for .bak files
  const bakOut = execSync('git ls-files "**/*.bak"', { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
  if (bakOut.length > 0) {
    console.error('Found tracked .bak files:\n' + bakOut);
    process.exit(1);
  }

  // Check for __tmp__ directories under source roots
  const tmpOut = execSync('git ls-files "**/__tmp__/**" "**/__tmp__"', { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
  if (tmpOut.length > 0) {
    console.error('Found tracked __tmp__ directories or files:\n' + tmpOut);
    process.exit(1);
  }

  process.exit(0);
} catch (err) {
  console.warn('check-no-bak: non-fatal error:', err?.message ?? err);
  process.exit(0);
}


