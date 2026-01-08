#!/usr/bin/env tsx
// scripts/setup/env-check.ts

import { execSync } from 'child_process';
import { logger } from '../utils/logger';

interface Tool {
  name: string;
  command: string;
  required: boolean;
}

const tools: Tool[] = [
  { name: 'Node.js', command: 'node -v', required: true },
  { name: 'pnpm', command: 'pnpm -v', required: true },
  { name: 'TypeScript', command: 'pnpm exec tsc -v', required: true },
  { name: 'ESLint', command: 'pnpm exec eslint -v', required: true },
  { name: 'Vitest', command: 'pnpm exec vitest --version', required: true },
  { name: 'ast-grep', command: 'pnpm exec ast-grep --version', required: false },
  { name: 'depcheck', command: 'pnpm exec depcheck --version', required: false },
  { name: 'dependency-cruiser', command: 'pnpm exec depcruise --version', required: false },
  { name: 'tree-sitter', command: 'pnpm exec tree-sitter --version', required: false },
  { name: 'gitleaks', command: 'pnpm exec gitleaks version', required: false },
  { name: 'ts-prune', command: 'pnpm exec ts-prune --version', required: false },
  { name: 'typedoc', command: 'pnpm exec typedoc --version', required: false },
  { name: 'Git', command: 'git --version', required: true },
  { name: 'GitHub CLI', command: 'gh --version', required: false },
];

function checkTool(tool: Tool): boolean {
  try {
    const output = execSync(tool.command, { encoding: 'utf8', stdio: 'pipe' });
    const version = output.trim().split('\n')[0];
    logger.success(`✅ ${tool.name.padEnd(20)} ${version ?? ''}`);
    return true;
  } catch (error) {
    if (tool.required) {
      logger.error(`❌ ${tool.name.padEnd(20)} NOT FOUND (REQUIRED)`);
      return false;
    } else {
      logger.warn(`⚠️  ${tool.name.padEnd(20)} NOT FOUND (OPTIONAL)`);
      return true;
    }
  }
}

function main() {
  logger.info('\n🔍 Corso Dev Environment Check\n');
  logger.info('Checking required and optional development tools...\n');

  let allRequiredPassed = true;
  let foundCount = 0;

  for (const tool of tools) {
    const found = checkTool(tool);
    if (found) {
      foundCount++;
    }
    if (tool.required && !found) {
      allRequiredPassed = false;
    }
  }

  logger.info('\n' + '='.repeat(50));
  logger.info(`📊 Summary: ${foundCount}/${tools.length} tools available`);
  
  if (allRequiredPassed) {
    logger.success('✅ All required tools are installed and accessible!');
    logger.info('💡 Install optional tools to enhance your development experience.');
    process.exit(0);
  } else {
    logger.error('❌ Some required tools are missing. Please install them before continuing.');
    process.exit(1);
  }
}

main(); 

