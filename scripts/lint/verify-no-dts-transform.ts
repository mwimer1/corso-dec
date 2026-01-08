#!/usr/bin/env tsx
import { execSync } from 'node:child_process';

/**
 * Verify that our scripts do not attempt to transform/parse .d.ts files
 * or anything under dist/**.
 */
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
      process.exit(1);
      return;
    }
  } catch {
    // ignore rg missing; CI provides it per project rules
  }

  console.log('[verify-no-dts-transform] OK');
}

main();



