#!/usr/bin/env tsx
/**
 * Windows-safe markdownlint wrapper that expands globs before passing to markdownlint.
 * 
 * This script uses glob to find markdown files first, then passes them as individual
 * file paths to markdownlint. This avoids Windows shell glob expansion issues.
 * 
 * Intent: Ensure markdownlint receives actual file paths, not glob patterns
 * Files: All markdown files in docs/ and README.md
 * Invocation: pnpm lint:md
 */
import { glob } from 'glob';
import { runLocalBin } from '../maintenance/_utils/run-local-bin';

async function main() {
  // Find all markdown files using glob (Windows-safe)
  // Use same ignore pattern as validate-docs.ts
  const docFiles = await glob('docs/**/*.md', { ignore: ['**/node_modules/**'] });
  const readmeFiles = await glob('README.md', { ignore: ['**/node_modules/**'] });
  
  const allFiles = [...docFiles, ...readmeFiles];
  
  if (allFiles.length === 0) {
    console.error('❌ No markdown files found. This likely indicates a glob expansion issue.');
    process.exit(1);
  }
  
  // Pass files as individual arguments to markdownlint (Windows-safe)
  const args = [...allFiles, '--config', '.markdownlint.jsonc'];
  
  const res = await runLocalBin('markdownlint', args).catch((err) => ({
    exitCode: 1,
    stdout: err?.message || '',
    stderr: String(err) || ''
  }));
  
  if (res.exitCode !== 0) {
    if (res.stdout) {
      console.error('Markdown lint errors:');
      console.error(res.stdout);
    }
    if (res.stderr) {
      console.error('Markdown lint errors (stderr):');
      console.error(res.stderr);
    }
    process.exit(1);
  }
  
  console.log('✅ Markdown linting passed');
}

void main().catch((err) => {
  console.error('❌ Markdown linting failed:', err);
  process.exit(1);
});
