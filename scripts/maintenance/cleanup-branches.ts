#!/usr/bin/env tsx
/**
 * Branch Cleanup Script
 *
 * Identifies and helps clean up stale remote branches that are no longer needed.
 * This script is safe - it only identifies branches and provides commands to run.
 */

import { execSync } from 'child_process';
import { logger } from '../utils/logger';

type BranchCategories = {
  'AI Generated Fix Branches (codex/*)': string[];
  'Backup Branches': string[];
  'Feature Branches': string[];
  'Other Branches': string[];
};

function getRemoteBranches(): string[] {
  return execSync('git branch -r', { encoding: 'utf8' })
    .split('\n')
    .map((branch) => branch.trim())
    .filter((branch) => branch && !branch.includes('->')) // Remove symlinks
    .filter((branch) => !branch.endsWith('/main')) // Keep main branch
    .filter((branch) => !branch.endsWith('/staging')) // Keep staging branch
    .sort();
}

function categorizeBranches(branches: string[]): BranchCategories {
  const categories: BranchCategories = {
    'AI Generated Fix Branches (codex/*)': [],
    'Backup Branches': [],
    'Feature Branches': [],
    'Other Branches': [],
  };

  branches.forEach((branch) => {
    if (branch.includes('codex/')) {
      categories['AI Generated Fix Branches (codex/*)'].push(branch);
    } else if (branch.includes('backup')) {
      categories['Backup Branches'].push(branch);
    } else if (branch.includes('feat/') || branch.includes('fix/')) {
      categories['Feature Branches'].push(branch);
    } else {
      categories['Other Branches'].push(branch);
    }
  });

  return categories;
}

function displayCategories(categories: BranchCategories): void {
  Object.entries(categories).forEach(([category, branches]) => {
    if (branches.length > 0) {
      logger.info(`📂 ${category} (${branches.length}):`);
      branches.forEach((branch) => {
        logger.info(`   ${branch}`);
      });
      logger.info('');
    }
  });
}

function generateCleanupCommands(categories: BranchCategories): void {
  logger.info('🔧 Recommended Cleanup Commands:\n');

  const {
    'AI Generated Fix Branches (codex/*)': codexBranches,
    'Backup Branches': backupBranches,
    'Feature Branches': featureBranches,
  } = categories;

  if (codexBranches.length > 0) {
    logger.info('# Delete AI-generated fix branches (likely safe):');
    codexBranches.forEach((branch) => {
      logger.info(`git push origin --delete ${branch.replace('origin/', '')}`);
    });
    logger.info('');
  }

  if (backupBranches.length > 0) {
    logger.warn('# Delete backup branches (⚠️  VERIFY WITH TEAM FIRST):');
    backupBranches.forEach((branch) => {
      logger.info(`# git push origin --delete ${branch.replace('origin/', '')} # VERIFY FIRST`);
    });
    logger.info('');
  }

  if (featureBranches.length > 0) {
    logger.info('# Check if feature branches are merged, then delete:');
    featureBranches.forEach((branch) => {
      const branchName = branch.replace('origin/', '');
      logger.info(`# Check: git branch -r --merged main | grep ${branchName}`);
      logger.info(`# If merged: git push origin --delete ${branchName}`);
    });
    logger.info('');
  }

  logger.info('🔄 After deleting remote branches, clean up local tracking:');
  logger.info('git remote prune origin');
  // Windows-friendly guidance
  logger.info('# POSIX:');
  logger.info('git branch -vv | grep ": gone]" | awk "{print $1}" | xargs git branch -d');
  logger.info('# PowerShell:');
  logger.info('git branch -vv | Select-String ": gone]" | ForEach-Object { ($_ -split "\s+")[2] } | ForEach-Object { git branch -d $_ }');
  logger.info('');
}

function main() {
  logger.info('🧹 Branch Cleanup Analysis\n');

  try {
    const remoteBranches = getRemoteBranches();
    logger.info(`Found ${remoteBranches.length} remote branches (excluding main/staging):\n`);

    const categories = categorizeBranches(remoteBranches);
    displayCategories(categories);
    generateCleanupCommands(categories);

    logger.success('✅ Branch analysis complete!');
    logger.info('💡 Tip: Run "git remote prune origin" regularly to clean up stale remote refs.');
  } catch (error) {
    logger.error('❌ Error analyzing branches:', error);
    process.exit(1);
  }
}

main();

