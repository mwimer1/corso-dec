#!/usr/bin/env tsx

/**
 * Directory Structure Scanner
 * 
 * Generates a clean, tree-like directory structure for analysis.
 * 
 * Usage:
 *   tsx scripts/tools/scan-directory.ts [directory] [options]
 * 
 * Examples:
 *   tsx scripts/tools/scan-directory.ts scripts
 *   tsx scripts/tools/scan-directory.ts components --max-depth 3
 *   tsx scripts/tools/scan-directory.ts . --exclude node_modules,dist,.next
 */

import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { COMMON_IGNORE_PATTERNS } from '../utils/constants';
import { walkDirectoryTreeSync, type TreeNode } from '../utils/fs/walker';

interface ScanOptions {
  maxDepth?: number;
  exclude?: string[];
  includeFiles?: boolean;
  includeDirs?: boolean;
  sort?: boolean;
}

class DirectoryScanner {
  private options: Required<ScanOptions>;

  constructor(options: ScanOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 10,
      exclude: options.exclude ?? [...COMMON_IGNORE_PATTERNS],
      includeFiles: options.includeFiles ?? true,
      includeDirs: options.includeDirs ?? true,
      sort: options.sort ?? true,
    };
  }

  private scanDirectory(dirPath: string): TreeNode[] {
    // Use unified walker utility
    const nodes = walkDirectoryTreeSync(dirPath, {
      maxDepth: this.options.maxDepth,
      exclude: this.options.exclude,
      includeFiles: this.options.includeFiles,
      includeDirs: this.options.includeDirs,
    });

    // Nodes are already sorted by walkDirectoryTreeSync
    return this.options.sort ? nodes : nodes;
  }

  private formatTree(nodes: TreeNode[], prefix = '', isLast = true): string[] {
    const lines: string[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const currentPrefix = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';
      
      if (!node) continue;
      lines.push(`${prefix}${currentPrefix}${node.name}`);
      
      if (node && node.children && node.children.length > 0) {
        const childLines = this.formatTree(node.children, prefix + childPrefix, false);
        lines.push(...childLines);
      }
    }
    
    return lines;
  }

  private formatCompact(nodes: TreeNode[]): string[] {
    const lines: string[] = [];
    
    for (const node of nodes) {
      const indent = '  '.repeat(node.depth);
      const icon = node.isDirectory ? '📁' : '📄';
      lines.push(`${indent}${icon} ${node.name}`);
      
      if (node.children && node.children.length > 0) {
        const childLines = this.formatCompact(node.children);
        lines.push(...childLines);
      }
    }
    
    return lines;
  }

  scan(targetPath: string, format: 'tree' | 'compact' = 'tree'): string[] {
    const absolutePath = path.resolve(targetPath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Directory does not exist: ${targetPath}`);
    }
    
    const stats = fs.statSync(absolutePath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${targetPath}`);
    }

    const rootNode: TreeNode = {
      name: path.basename(absolutePath),
      path: absolutePath,
      isDirectory: true,
      children: this.scanDirectory(absolutePath),
      depth: 0,
    };

    if (format === 'compact') {
      return this.formatCompact([rootNode]);
    } else {
      return this.formatTree([rootNode]);
    }
  }

  getStats(targetPath: string): {
    totalFiles: number;
    totalDirs: number;
    totalItems: number;
    maxDepth: number;
  } {
    const absolutePath = path.resolve(targetPath);
    const excludeSet = new Set(this.options.exclude);
    
    // Use walker to get all files and dirs, then count
    const result = walkDirectoryTreeSync(absolutePath, {
      maxDepth: this.options.maxDepth,
      exclude: this.options.exclude,
      includeFiles: this.options.includeFiles,
      includeDirs: this.options.includeDirs,
    });

    let totalFiles = 0;
    let totalDirs = 0;
    let maxDepth = 0;

    const countNodes = (nodes: TreeNode[], depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      for (const node of nodes) {
        if (node.isDirectory) {
          totalDirs++;
          if (node.children) {
            countNodes(node.children, depth + 1);
          }
        } else {
          totalFiles++;
        }
      }
    };

    countNodes(result, 0);

    return {
      totalFiles,
      totalDirs,
      totalItems: totalFiles + totalDirs,
      maxDepth,
    };
  }
}

function parseArgs(): {
  targetPath: string;
  options: ScanOptions;
  format: 'tree' | 'compact';
  showStats: boolean;
  json: boolean;
  noEmoji: boolean;
} {
  const argv = yargs(hideBin(process.argv))
    .scriptName('scan-directory')
    .usage('Directory Structure Scanner\n\nUsage: $0 [directory] [options]')
    .positional('directory', {
      type: 'string',
      default: '.',
      description: 'Directory to scan (default: current directory)',
    })
    .option('max-depth', {
      type: 'number',
      description: 'Maximum depth to scan (default: 10)',
    })
    .option('exclude', {
      type: 'string',
      description: 'Comma-separated patterns to exclude',
    })
    .option('no-files', {
      type: 'boolean',
      description: 'Exclude files from output',
    })
    .option('no-dirs', {
      type: 'boolean',
      description: 'Exclude directories from output',
    })
    .option('compact', {
      type: 'boolean',
      description: 'Use compact format instead of tree',
    })
    .option('stats', {
      type: 'boolean',
      description: 'Show statistics only',
    })
    .option('json', {
      type: 'boolean',
      description: 'Emit machine-readable JSON',
    })
    .option('no-emoji', {
      type: 'boolean',
      description: 'Disable emojis in output labels',
    })
    .help()
    .alias('help', 'h')
    .example('$0 scripts', 'Scan scripts directory')
    .example('$0 components --max-depth 3', 'Scan with depth limit')
    .example('$0 . --exclude node_modules,dist,.next', 'Scan with exclusions')
    .example('$0 . --compact', 'Use compact format')
    .example('$0 . --stats', 'Show statistics only')
    .parseSync();

  const targetPath = (argv.directory as string) ?? '.';
  const options: ScanOptions = {};
  
  if (argv['max-depth']) {
    options.maxDepth = argv['max-depth'];
  }
  if (argv.exclude) {
    options.exclude = argv.exclude.split(',').map(s => s.trim());
  }
  if (argv['no-files']) {
    options.includeFiles = false;
  }
  if (argv['no-dirs']) {
    options.includeDirs = false;
  }

  return {
    targetPath,
    options,
    format: argv.compact ? 'compact' : 'tree',
    showStats: argv.stats ?? false,
    json: argv.json ?? false,
    noEmoji: argv['no-emoji'] ?? false,
  };
}

function main() {
  try {
    const { targetPath, options, format, showStats, json, noEmoji } = parseArgs();

    const scanner = new DirectoryScanner(options);

    if (json) {
      const stats = scanner.getStats(targetPath);
      const lines = scanner.scan(targetPath, format);
      console.log(JSON.stringify({ targetPath, format, stats, lines }, null, 2));
      return;
    }

    if (showStats) {
      const stats = scanner.getStats(targetPath);
      console.log(`\n${noEmoji ? 'Directory Statistics' : '📊'} Directory Statistics for: ${targetPath}`);
      console.log(`${noEmoji ? 'Dirs' : '📁'} Total Directories: ${stats.totalDirs}`);
      console.log(`${noEmoji ? 'Files' : '📄'} Total Files: ${stats.totalFiles}`);
      console.log(`${noEmoji ? 'Items' : '📊'} Total Items: ${stats.totalItems}`);
      console.log(`${noEmoji ? 'Max Depth' : '🔍'} Max Depth: ${stats.maxDepth}`);
      return;
    }

    const lines = scanner.scan(targetPath, format);
    
    console.log(`\n${noEmoji ? '' : (format === 'tree' ? '🌳 ' : '📋 ')}Directory Structure: ${targetPath}\n`);
    
    if (lines.length === 0) {
      console.log('(empty directory or all items excluded)');
    } else {
      lines.forEach(line => console.log(line));
    }

    // Show summary
    const stats = scanner.getStats(targetPath);
    console.log(`\n${noEmoji ? 'Summary' : '📊 Summary'}: ${stats.totalDirs} dirs, ${stats.totalFiles} files, max depth: ${stats.maxDepth}`);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);
    process.exit(1);
  }
}

// Run the script
main();
