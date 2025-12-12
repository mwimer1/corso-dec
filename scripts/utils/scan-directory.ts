#!/usr/bin/env tsx

/**
 * Directory Structure Scanner
 * 
 * Generates a clean, tree-like directory structure for analysis.
 * 
 * Usage:
 *   tsx tools/scripts/scan-directory.ts [directory] [options]
 * 
 * Examples:
 *   tsx tools/scripts/scan-directory.ts scripts
 *   tsx tools/scripts/scan-directory.ts components --max-depth 3
 *   tsx tools/scripts/scan-directory.ts . --exclude node_modules,dist,.next
 */

import fs from 'fs';
import path from 'path';

interface ScanOptions {
  maxDepth?: number;
  exclude?: string[];
  includeFiles?: boolean;
  includeDirs?: boolean;
  sort?: boolean;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
  depth: number;
}

class DirectoryScanner {
  private options: Required<ScanOptions>;
  private currentDepth = 0;

  constructor(options: ScanOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 10,
      exclude: options.exclude ?? ['node_modules', 'dist', '.next', '.git', 'coverage'],
      includeFiles: options.includeFiles ?? true,
      includeDirs: options.includeDirs ?? true,
      sort: options.sort ?? true,
    };
  }

  private shouldExclude(name: string): boolean {
    return this.options.exclude.some(pattern => 
      name.includes(pattern) || 
      (pattern.startsWith('.') && name.startsWith(pattern))
    );
  }

  private scanDirectory(dirPath: string, depth: number): TreeNode[] {
    if (depth > this.options.maxDepth) {
      return [];
    }

    try {
      const items = fs.readdirSync(dirPath);
      const nodes: TreeNode[] = [];

      for (const item of items) {
        if (this.shouldExclude(item)) {
          continue;
        }

        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        const isDirectory = stats.isDirectory();

        if (isDirectory && this.options.includeDirs) {
          const children = this.scanDirectory(fullPath, depth + 1);
          nodes.push({
            name: item,
            path: fullPath,
            isDirectory: true,
            children,
            depth,
          });
        } else if (!isDirectory && this.options.includeFiles) {
          nodes.push({
            name: item,
            path: fullPath,
            isDirectory: false,
            depth,
          });
        }
      }

      if (this.options.sort) {
        // Sort directories first, then files, both alphabetically
        return nodes.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      }

      return nodes;
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dirPath}: ${error}`);
      return [];
    }
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
      children: this.scanDirectory(absolutePath, 0),
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
    let totalFiles = 0;
    let totalDirs = 0;
    let maxDepth = 0;

    const countItems = (dirPath: string, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      
      try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          if (this.shouldExclude(item)) {
            continue;
          }

          const fullPath = path.join(dirPath, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            totalDirs++;
            countItems(fullPath, depth + 1);
          } else {
            totalFiles++;
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    countItems(absolutePath, 0);

    return {
      totalFiles,
      totalDirs,
      totalItems: totalFiles + totalDirs,
      maxDepth,
    };
  }
}

function printUsage() {
  console.log(`
Directory Structure Scanner

Usage:
  tsx tools/scripts/scan-directory.ts [directory] [options]

Arguments:
  directory              Directory to scan (default: current directory)

Options:
  --max-depth <number>   Maximum depth to scan (default: 10)
  --exclude <patterns>   Comma-separated patterns to exclude
  --no-files            Exclude files from output
  --no-dirs             Exclude directories from output
  --compact             Use compact format instead of tree
  --stats               Show statistics only
  --json                Emit machine-readable JSON
  --no-emoji            Disable emojis in output labels
  --help                Show this help message

Examples:
  tsx tools/scripts/scan-directory.ts scripts
  tsx tools/scripts/scan-directory.ts components --max-depth 3
  tsx tools/scripts/scan-directory.ts . --exclude node_modules,dist,.next
  tsx tools/scripts/scan-directory.ts . --compact
  tsx tools/scripts/scan-directory.ts . --stats
`);
}

function parseArgs(args: string[]): {
  targetPath: string;
  options: ScanOptions;
  format: 'tree' | 'compact';
  showStats: boolean;
  json: boolean;
  noEmoji: boolean;
} {
  let targetPath = '.';
  const options: ScanOptions = {};
  let format: 'tree' | 'compact' = 'tree';
  let showStats = false;
  let json = false;
  let noEmoji = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--max-depth') {
      const next = args[++i];
      options.maxDepth = next ? parseInt(next) : (options.maxDepth ?? 10);
    } else if (arg === '--exclude') {
      const next = args[++i];
      options.exclude = next ? next.split(',').map(s => s.trim()) : (options.exclude ?? []);
    } else if (arg === '--no-files') {
      options.includeFiles = false;
    } else if (arg === '--no-dirs') {
      options.includeDirs = false;
    } else if (arg === '--compact') {
      format = 'compact';
    } else if (arg === '--stats') {
      showStats = true;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--no-emoji') {
      noEmoji = true;
    } else if (arg && !arg.startsWith('--')) {
      targetPath = arg ?? targetPath;
    }
  }

  return { targetPath, options, format, showStats, json, noEmoji };
}

function main() {
  try {
    const args = process.argv.slice(2);
    const { targetPath, options, format, showStats, json, noEmoji } = parseArgs(args);

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

