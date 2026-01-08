#!/usr/bin/env tsx
/**
 * Docs Auto-Publish Script
 *
 * Safely regenerates and publishes documentation changes to main branch.
 * Only stages/commits allowlisted doc output files.
 *
 * Usage:
 *   pnpm docs:auto-publish              # Interactive mode
 *   pnpm docs:auto-publish --dry-run    # Preview changes without committing
 *   pnpm docs:auto-publish --yes        # Skip confirmation prompt
 *   pnpm docs:auto-publish --quiet      # Minimal output
 */

import { execa } from 'execa';
import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';

interface Options {
  dryRun: boolean;
  yes: boolean;
  quiet: boolean;
}

// Allowlist of files that MAY be staged/committed
const DOC_ALLOWLIST = [
  'docs/index.ts',
  'docs/README.md',
  'scripts/**/README.md',
  'lib/**/README.md',
  'types/**/README.md',
  'components/**/README.md',
  'styles/**/README.md',
  'app/**/README.md',
] as const;

function matchesAllowlist(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return DOC_ALLOWLIST.some(pattern => {
    // Convert glob pattern to regex
    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
    return regex.test(normalized);
  });
}

async function runCommand(cmd: string, args: string[], options: Options): Promise<string> {
  if (!options.quiet) {
    console.log(`▶ ${cmd} ${args.join(' ')}`);
  }
  try {
    const result = await execa(cmd, args, {
      cwd: process.cwd(),
      stdio: options.quiet ? 'pipe' : 'inherit',
    });
    return result.stdout || '';
  } catch (error: any) {
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function checkBranch(): Promise<void> {
  const { stdout: currentBranch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: process.cwd(),
  });
  
  if (currentBranch.trim() !== 'main') {
    throw new Error(`Must be on branch 'main' (currently on '${currentBranch.trim()}')`);
  }
}

async function checkCleanWorkingTree(options: Options): Promise<void> {
  const { stdout: status } = await execa('git', ['status', '--porcelain'], {
    cwd: process.cwd(),
  });
  
  if (!status.trim()) {
    // Working tree is clean
    return;
  }
  
  // Check if all changes are allowlisted
  const lines = status.trim().split('\n');
  const changedFiles = lines
    .map(line => line.substring(3).trim()) // Remove status prefix (e.g., " M ")
    .filter(Boolean);
  
  const nonAllowlisted = changedFiles.filter(file => !matchesAllowlist(file));
  
  if (nonAllowlisted.length > 0) {
    throw new Error(
      `Working tree contains non-doc files:\n${nonAllowlisted.map(f => `  - ${f}`).join('\n')}\n` +
      `Only doc files may be modified. Please commit or stash other changes first.`
    );
  }
  
  if (!options.quiet) {
    console.log(`✓ Working tree has only doc changes (${changedFiles.length} file(s))`);
  }
}

async function checkStagedChanges(): Promise<void> {
  const { stdout: diff } = await execa('git', ['diff', '--cached', '--name-only'], {
    cwd: process.cwd(),
  });
  
  if (diff.trim()) {
    throw new Error(
      `Pre-existing staged changes detected:\n${diff.trim().split('\n').map(f => `  - ${f}`).join('\n')}\n` +
      `Please commit or unstage these changes first.`
    );
  }
}

async function checkUpToDate(options: Options): Promise<void> {
  if (!options.quiet) {
    console.log('🔍 Checking if local main is up-to-date with origin/main...');
  }
  
  await runCommand('git', ['fetch', 'origin'], options);
  
  const { stdout: counts } = await execa(
    'git',
    ['rev-list', '--left-right', '--count', 'origin/main...main'],
    { cwd: process.cwd() }
  );
  
  const parts = counts.trim().split('\t');
  const behind = parts[0] ? Number(parts[0]) : 0;
  const ahead = parts[1] ? Number(parts[1]) : 0;
  
  if (behind > 0) {
    throw new Error(
      `Local main is ${behind} commit(s) behind origin/main. ` +
      `Please pull first to avoid overwriting remote changes.`
    );
  }
  
  if (!options.quiet && ahead > 0) {
    console.log(`⚠ Local main is ${ahead} commit(s) ahead of origin/main`);
  }
}

async function generateDocs(options: Options): Promise<void> {
  if (!options.quiet) {
    console.log('\n📚 Generating documentation...');
  }
  
  await runCommand('pnpm', ['docs:index'], options);
  await runCommand('pnpm', ['docs:generate:readme'], options);
  await runCommand('pnpm', ['docs:generate:directory-readmes'], options);
  
  if (!options.quiet) {
    console.log('✓ Documentation generated\n');
  }
}

async function getChangedFiles(): Promise<string[]> {
  const { stdout: status } = await execa('git', ['status', '--porcelain'], {
    cwd: process.cwd(),
  });
  
  if (!status.trim()) {
    return [];
  }
  
  const lines = status.trim().split('\n');
  return lines
    .map(line => line.substring(3).trim()) // Remove status prefix
    .filter(Boolean);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: Options = {
    dryRun: args.includes('--dry-run'),
    yes: args.includes('--yes'),
    quiet: args.includes('--quiet'),
  };
  
  if (!options.quiet) {
    console.log('🚀 Docs Auto-Publish\n');
  }
  
  try {
    // Preflight checks
    await checkBranch();
    await checkStagedChanges();
    await checkCleanWorkingTree(options);
    await checkUpToDate(options);
    
    // Generate docs
    await generateDocs(options);
    
    // Check for changes
    const changedFiles = await getChangedFiles();
    
    if (changedFiles.length === 0) {
      if (!options.quiet) {
        console.log('✓ No changes to publish');
      }
      process.exit(0);
    }
    
    // Validate all changes are allowlisted
    const nonAllowlisted = changedFiles.filter(file => !matchesAllowlist(file));
    if (nonAllowlisted.length > 0) {
      throw new Error(
        `Non-doc files would be committed:\n${nonAllowlisted.map(f => `  - ${f}`).join('\n')}\n` +
        `Only doc files may be committed. Aborting.`
      );
    }
    
    if (!options.quiet) {
      console.log(`📝 Changed files (${changedFiles.length}):`);
      changedFiles.forEach(file => console.log(`   ${file}`));
      console.log();
    }
    
    if (options.dryRun) {
      if (!options.quiet) {
        console.log('🔍 Dry-run mode: No changes will be committed or pushed\n');
      }
      process.exit(0);
    }
    
    // Confirm (unless --yes)
    if (!options.yes) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const answer = await new Promise<string>(resolve => {
        readline.question('Commit and push these changes to main? (y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        if (!options.quiet) {
          console.log('Aborted');
        }
        process.exit(0);
      }
    }
    
    // Stage allowlisted files
    if (!options.quiet) {
      console.log('📦 Staging changes...');
    }
    await runCommand('git', ['add', ...changedFiles], options);
    
    // Verify staged set
    const { stdout: staged } = await execa('git', ['diff', '--cached', '--name-only'], {
      cwd: process.cwd(),
    });
    const stagedFiles = staged.trim().split('\n').filter(Boolean);
    const stagedNonAllowlisted = stagedFiles.filter(file => !matchesAllowlist(file));
    
    if (stagedNonAllowlisted.length > 0) {
      throw new Error(
        `Non-doc files were staged:\n${stagedNonAllowlisted.map(f => `  - ${f}`).join('\n')}\n` +
        `This should not happen. Aborting.`
      );
    }
    
    // Commit
    if (!options.quiet) {
      console.log('💾 Committing changes...');
    }
    await runCommand(
      'git',
      ['commit', '-m', 'chore(docs): refresh generated docs', '--no-verify'],
      options
    );
    
    // Push
    if (!options.quiet) {
      console.log('📤 Pushing to origin/main...');
    }
    await runCommand('git', ['push', 'origin', 'main', '--no-verify'], options);
    
    if (!options.quiet) {
      console.log('\n✅ Docs published successfully!');
    }
  } catch (error: any) {
    if (!options.quiet) {
      console.error('\n❌ Error:', error.message || String(error));
    }
    process.exit(1);
  }
}

void main();
