#!/usr/bin/env tsx
// scripts/lint/check-circular-deps.ts

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

function main() {
  const graphPath = join(process.cwd(), 'dependency-graph.dot');

  if (!existsSync(graphPath)) {
    logger.error('dependency-graph.dot not found. Run `pnpm deps:graph` first.');
    process.exit(1);
  }

  const graphContent = readFileSync(graphPath, 'utf8');

  const circularRegex = /subgraph "cluster_(\d+)" {\s*label="circular dependency"/g;
  const matches = graphContent.matchAll(circularRegex);

  const circularDependencies: string[][] = [];

  for (const match of matches) {
    const clusterNum = match[1];
    const moduleRegex = new RegExp(`subgraph "cluster_${clusterNum}" {[\\s\\S]*?}`, 'g');
    const moduleMatch = moduleRegex.exec(graphContent);

    if (moduleMatch) {
      const moduleSection = moduleMatch[0];
      const moduleLines = moduleSection.split('\n');
      const modulePaths: string[] = [];

      for (const line of moduleLines) {
        const modulePathMatch = /"\$\$([^"]+)"/.exec(line);
        if (modulePathMatch) {
          modulePaths.push(modulePathMatch[1] ?? '');
        }
      }

      if (modulePaths.length > 0) {
        circularDependencies.push(modulePaths);
      }
    }
  }

  if (circularDependencies.length > 0) {
    logger.error('❌ Found circular dependencies:');

    circularDependencies.forEach((cycle, index) => {
      logger.error(`\n🚨 Circular Dependency #${index + 1}:`);
      cycle.forEach((module) => logger.error(`  - ${module}`));
    });

    logger.info('\n💡 Fix recommendations:');
    logger.info('  1. Break circular imports by restructuring modules.');
    logger.info('  2. Use concrete file imports instead of barrel files when needed.');
    logger.info('  3. Move shared logic to a new module imported by both sides.');
    
    process.exit(1);
  } else {
    logger.success('✅ No circular dependencies found. Great job!');
    process.exit(0);
  }
}

main();

