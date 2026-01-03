#!/usr/bin/env node
/**
 * Script to update GitHub Action SHA pins
 * Cross-platform Node.js implementation using fetch API
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = join(__dirname, '..', 'workflows');

// Use GitHub Actions token if available, otherwise require GITHUB_TOKEN env var
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 
                     (process.env.CI && process.env.GITHUB_TOKEN) || 
                     null;

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.error('');
  console.error('   For local execution:');
  console.error('     export GITHUB_TOKEN=your_pat_here');
  console.error('     node .github/scripts/update-action-shas.mjs');
  console.error('');
  console.error('   Create a token at: https://github.com/settings/tokens');
  console.error('   Required scope: public_repo (or repo for private repos)');
  console.error('');
  console.error('   Note: In GitHub Actions, GITHUB_TOKEN is automatically available');
  process.exit(1);
}

/**
 * Get latest SHA for an action tag using GitHub API
 */
async function getLatestSha(owner, repo, tag) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/ref/tags/${tag}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'corso-action-sha-updater'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Try branches if tag doesn't exist
        const branchUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${tag}`;
        const branchResponse = await fetch(branchUrl, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'corso-action-sha-updater'
          }
        });

        if (!branchResponse.ok) {
          throw new Error(`Tag/branch ${tag} not found (${branchResponse.status})`);
        }

        const branchData = await branchResponse.json();
        return branchData.object.sha;
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.object.sha;
  } catch (error) {
    console.error(`Error fetching SHA for ${owner}/${repo}@${tag}:`, error.message);
    return null;
  }
}

/**
 * Parse action reference (owner/repo@version)
 */
function parseAction(actionRef) {
  // Remove leading ./ if present (local actions)
  if (actionRef.startsWith('./')) {
    return null; // Skip local actions
  }

  const match = actionRef.match(/^([^@]+)@(.+)$/);
  if (!match) {
    return null;
  }

  const [, actionPath, version] = match;
  const parts = actionPath.split('/');
  
  if (parts.length < 2) {
    return null; // Invalid format
  }

  const owner = parts[0];
  const repo = parts.slice(1).join('/');

  return { owner, repo, version };
}

/**
 * Update SHA pins in a workflow file
 */
async function updateWorkflowFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  const updates = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match uses: statements (handles both - uses: and uses: after - name:)
    // Remove trailing \r if present (Windows line endings)
    const cleanLine = line.replace(/\r$/, '');
    // Match: "- uses: action@version" or "        uses: action@version" (after - name:)
    const match = cleanLine.match(/^(\s*(?:-\s*)?)uses:\s+([^@]+@[^#\s]+)(\s*#.*)?$/);
    if (!match) {
      continue;
    }

    const [, indent, actionRef, existingComment] = match;
    const parsed = parseAction(actionRef.trim());

    if (!parsed) {
      continue; // Skip local actions or invalid formats
    }

    // Skip if already pinned (has a full SHA, which is 40 hex chars)
    if (/^[a-f0-9]{40}$/i.test(parsed.version)) {
      continue; // Already pinned
    }

    // Found an unpinned action
    console.log(`  Found unpinned: ${parsed.owner}/${parsed.repo}@${parsed.version}`);

    const sha = await getLatestSha(parsed.owner, parsed.repo, parsed.version);
    if (!sha) {
      console.warn('    ⚠️  Could not fetch SHA, skipping');
      continue;
    }

    // Preserve original version in comment
    const comment = existingComment?.trim() || ` # ${parsed.version}`;
    const newActionRef = `${parsed.owner}/${parsed.repo}@${sha}${comment}`;
    lines[i] = `${indent}uses: ${newActionRef}`;

    updates.push({
      old: actionRef,
      new: `${parsed.owner}/${parsed.repo}@${sha}${comment}`,
      sha
    });

    modified = true;
    console.log(`    ✅ ${parsed.owner}/${parsed.repo}@${parsed.version} → ${sha.substring(0, 7)}...`);
  }

  if (modified) {
    writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return updates;
  }

  return [];
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Updating GitHub Action SHA pins...\n');

  try {
    const files = await readdir(WORKFLOWS_DIR);
    const workflowFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

    if (workflowFiles.length === 0) {
      console.log('No workflow files found');
      return;
    }

    let totalUpdates = 0;

    for (const file of workflowFiles) {
      const filePath = join(WORKFLOWS_DIR, file);
      console.log(`Processing: ${file}`);
      
      const updates = await updateWorkflowFile(filePath);
      totalUpdates += updates.length;

      if (updates.length > 0) {
        console.log(`  Updated ${updates.length} action(s)\n`);
      } else {
        console.log('  No updates needed\n');
      }
    }

    if (totalUpdates > 0) {
      console.log(`✅ SHA pinning update complete! Updated ${totalUpdates} action(s) across ${workflowFiles.length} workflow file(s).`);
    } else {
      console.log('✅ All actions are already pinned to SHAs.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
