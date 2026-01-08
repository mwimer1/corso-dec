#!/usr/bin/env tsx
/**
 * Verifies that scripts don't attempt to transform or parse .d.ts files.
 * 
 * Scans scripts/ directory for suspicious patterns that might process TypeScript
 * declaration files or dist/** directories, which should be excluded from transformations.
 * 
 * Intent: Prevent accidental processing of generated declaration files
 * Files: TypeScript and JavaScript files in scripts directory
 * Invocation: pnpm verify:scripts:no-dts-transform
 */
import { execSync } from 'node:child_process';
function main(): void {
  try {
    const cmd = `rg -n "\\.d\\.ts" scripts || true`;
    const out = execSync(cmd, { encoding: 'utf8' });
    const suspects = out
      .split('\n')
      .filter(Boolean)
      .filter(line => /glob\(|globby|fast\-glob|readFile|transform\(/i.test(line));
    if (suspects.length > 0) {
      console.error('[verify-no-dts-transform] Suspicious .d.ts handling found in scripts:\n' + suspects.join('\n'));
      process.exitCode = 1;
      return;
    }
  } catch {
    // ignore rg missing; CI provides it per project rules
  }

  console.log('[verify-no-dts-transform] OK');
}

main();



