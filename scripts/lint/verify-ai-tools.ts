#!/usr/bin/env tsx

/**
 * AI Agent Tools Verification Script
 * 
 * Verifies that all essential AI agent tools are installed and working correctly.
 * This script helps troubleshoot installation issues and ensures compatibility.
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

type ToolStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

interface ToolTest {
  name: string;
  command: string;
  expectedInOutput?: string;
  description: string;
  required: boolean;
}

function tryCommand(cmd: string, args: string[]) {
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  const ok = res.status === 0;
  return {
    ok,
    stdout: (res.stdout || '').toString().trim(),
    stderr: (res.stderr || '').toString().trim(),
    error: ok ? undefined : (res.error?.message || res.stderr?.toString() || 'Unknown error'),
    cmdString: [cmd, ...args].join(' '),
  };
}

const AI_TOOLS: ToolTest[] = [
  {
    name: 'jscodeshift',
    command: 'pnpm exec jscodeshift --version',
    expectedInOutput: 'jscodeshift:',
    description: 'AST-based code transformations',
    required: true
  },
  {
    name: 'doctoc',
    command: 'pnpm exec doctoc --help',
    expectedInOutput: 'Usage: doctoc',
    description: 'Table of contents generator',
    required: true
  },
  {
    name: 'lighthouse-ci',
    command: 'pnpm exec lhci --version',
    expectedInOutput: '',
    description: 'Performance testing and monitoring',
    required: true
  },
  {
    name: 'prism',
    command: 'pnpm exec prism --version',
    expectedInOutput: '',
    description: 'API mocking and validation',
    required: true
  },
  {
    name: 'remark-cli',
    command: 'pnpm exec remark --version',
    expectedInOutput: 'remark:',
    description: 'Markdown processing',
    required: true
  },
  {
    name: 'alex',
    command: 'pnpm exec alex --version',
    expectedInOutput: '',
    description: 'Inclusive writing linter',
    required: true
  },
  {
    name: 'conventional-changelog',
    command: 'pnpm exec conventional-changelog --version',
    expectedInOutput: '',
    description: 'Automated changelog generation',
    required: true
  },
  {
    name: 'gitleaks',
    command: 'gitleaks version',
    expectedInOutput: '',
    description: 'Secret detection in git repositories',
    required: false // Optional locally; required in CI
  }
];

const EXISTING_TOOLS: ToolTest[] = [
  {
    name: 'ast-grep',
    command: 'ast-grep --version',
    expectedInOutput: 'ast-grep',
    description: 'Structural code search',
    required: false
  },
  {
    name: 'tree-sitter',
    command: 'tree-sitter --version',
    expectedInOutput: 'tree-sitter',
    description: 'Code parsing',
    required: false
  },
  {
    name: 'ripgrep',
    command: 'rg --version',
    expectedInOutput: 'ripgrep',
    description: 'Fast text search',
    required: false
  },
  {
    name: 'fd',
    command: 'fd --version',
    expectedInOutput: 'fd',
    description: 'Fast file finder',
    required: false
  },
  {
    name: 'bat',
    command: 'bat --version',
    expectedInOutput: 'bat',
    description: 'Syntax-highlighted file viewer',
    required: false
  },
  {
    name: 'github-cli',
    command: 'gh --version',
    expectedInOutput: 'gh version',
    description: 'GitHub operations',
    required: false
  }
];

function reportStatus(name: string, status: ToolStatus, details: string) {
  const icon = status === 'SUCCESS' ? '✅' : status === 'SKIPPED' ? '⏭️' : '❌';
  console.log(`   ${icon} ${status} - ${details}`);
}

function testTool(tool: ToolTest, isCI: boolean): { status: ToolStatus; ok: boolean } {
  console.log(`\n🔍 Testing ${tool.name}...`);
  console.log(`   Description: ${tool.description}`);

  const parts = tool.command.split(' ');
  const cmd = parts[0] ?? '';
  const args = parts.slice(1);
  let result = tryCommand(cmd, args);

  // Special handling: prism fallback via pnpm dlx
  if (!result.ok && tool.name === 'prism') {
    console.log(`   Command: ${result.cmdString}`);
    console.log(`   ↪️ Fallback: pnpm dlx @stoplight/prism-cli --version`);
    result = tryCommand('pnpm', ['dlx', '@stoplight/prism-cli', '--version']);
  } else {
    console.log(`   Command: ${result.cmdString}`);
  }

  if (tool.name === 'gitleaks') {
    if (!result.ok && !isCI) {
      reportStatus(tool.name, 'SKIPPED', '`gitleaks` not found on PATH (optional locally). Install gitleaks and restart your shell.');
      return { status: 'SKIPPED', ok: true };
    }
  }

  if (result.ok) {
    if (tool.expectedInOutput && !result.stdout.includes(tool.expectedInOutput)) {
      reportStatus(tool.name, 'FAILED', `Expected "${tool.expectedInOutput}" in output. Output: ${result.stdout.substring(0, 100)}...`);
      return { status: 'FAILED', ok: false };
    }
    const versionLine = result.stdout.split('\n')[0] || result.stdout || 'ok';
    reportStatus(tool.name, 'SUCCESS', `Version: ${versionLine}`);
    return { status: 'SUCCESS', ok: true };
  }

  // Actionable help per tool
  if (tool.name === 'prism') {
    reportStatus(tool.name, 'FAILED', `Failed to run prism. Use bin 'prism' or fallback 'pnpm dlx @stoplight/prism-cli --version'. Error: ${result.error}`);
  } else if (tool.name === 'remark-cli') {
    reportStatus(tool.name, 'FAILED', `Use the bin 'remark' (not 'remark-cli'). Error: ${result.error}`);
  } else if (tool.name === 'alex') {
    reportStatus(tool.name, 'FAILED', `Remove the pnpm override for 'find-up' (or bump to ^6.3.0+) and run 'pnpm install'. Error: ${result.error}`);
  } else if (tool.name === 'gitleaks') {
    reportStatus(tool.name, 'FAILED', `Install gitleaks in the CI/DevContainer image so it’s on PATH. Error: ${result.error}`);
  } else {
    reportStatus(tool.name, 'FAILED', result.error || 'Unknown error');
  }
  return { status: 'FAILED', ok: false };
}

function checkDevContainer(): boolean {
  const devcontainerPath = path.join(process.cwd(), '.devcontainer');
  if (existsSync(devcontainerPath)) {
    console.log('📦 DevContainer configuration detected');
    console.log('   💡 For best AI agent experience, use: "Dev Containers: Reopen in Container"');
    return true;
  }
  return false;
}

function main() {
  console.log('🤖 AI Agent Tools Verification');
  console.log('=====================================\n');
  
  const hasDevContainer = checkDevContainer();
  
  console.log('\n📋 Testing Newly Installed AI Agent Tools:');
  console.log('============================================');
  
  let newToolsWorking = 0;
  let newToolsRequired = 0;
  let skippedOptional = 0;
  
  for (const tool of AI_TOOLS) {
    const { status, ok } = testTool(tool, !!process.env['CI']);
    if (status === 'SKIPPED') skippedOptional++;
    if (ok) newToolsWorking++;
    if (tool.required || (tool.name === 'gitleaks' && !!process.env['CI'])) newToolsRequired++;
  }
  
  console.log('\n📋 Testing Existing Development Tools:');
  console.log('======================================');
  
  let existingToolsWorking = 0;
  
  for (const tool of EXISTING_TOOLS) {
    const { ok } = testTool(tool, !!process.env['CI']);
    if (ok) existingToolsWorking++;
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`New AI Tools: ${newToolsWorking}/${AI_TOOLS.length} working`);
  console.log(`Existing Tools: ${existingToolsWorking}/${EXISTING_TOOLS.length} working`);
  
  console.log(`Optional Skipped: ${skippedOptional}`);
  console.log(`Required New Tools: ${newToolsWorking - skippedOptional}/${newToolsRequired} working`);
  
  console.log('\n🎯 Quick Usage Examples:');
  console.log('========================');
  console.log('pnpm run ai:docs:toc      # Generate table of contents');
  console.log('pnpm run ai:docs:lint     # Lint markdown files');
  console.log('pnpm run ai:performance   # Run performance audit');
  console.log('pnpm run ai:security      # Scan for secrets (after PATH update)');
  console.log('pnpm run ai:changelog     # Generate changelog from commits');
  
  const anyRequiredFailed = newToolsWorking - skippedOptional < newToolsRequired;
  if (anyRequiredFailed) {
    console.log('\n⚠️  Some required tools are not working. Consider:');
    console.log('   1. Restarting your terminal/shell');
    console.log('   2. Using DevContainer for consistent environment');
    console.log('   3. Checking installation logs for errors');
    process.exitCode = 1;
  } else {
    console.log('\n🎉 All required AI agent tools are working correctly!');
    if (!hasDevContainer) {
      console.log('💡 Consider using DevContainer for the most comprehensive AI agent environment.');
    }
  }
}

// tsx runs this script in an ESM context where "require" is undefined.
// Simply invoke the verification routine directly.
main(); 

