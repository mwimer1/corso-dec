#!/usr/bin/env tsx
/**
 * Cross-platform script to preview or delete .cursor directories older than 1 day
 * 
 * Usage:
 *   tsx scripts/maintenance/cleanup-cursor.ts                    # Preview only
 *   tsx scripts/maintenance/cleanup-cursor.ts --delete           # Delete directories
 *   tsx scripts/maintenance/cleanup-cursor.ts --archive DIR      # Move to archive directory
 *   tsx scripts/maintenance/cleanup-cursor.ts --help             # Show help
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

interface Options {
  delete: boolean;
  archive?: string;
  help: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = {
    delete: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--delete') {
      opts.delete = true;
    } else if (arg === '--archive') {
      if (i + 1 < args.length) {
        const archivePath = args[++i];
        if (archivePath) {
          opts.archive = archivePath;
        } else {
          console.error('❌ --archive requires a directory path');
          process.exit(1);
        }
      } else {
        console.error('❌ --archive requires a directory path');
        process.exit(1);
      }
    } else if (arg === '--help') {
      opts.help = true;
    } else {
      console.error(`❌ Unknown argument: ${arg}`);
      console.error('Usage: tsx scripts/maintenance/cleanup-cursor.ts [--delete] [--archive DIR] [--help]');
      process.exit(1);
    }
  }

  return opts;
}

async function findCursorDirs(homeDir: string): Promise<string[]> {
  const results: string[] = [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  async function scanDir(dirPath: string, depth: number = 0): Promise<void> {
    // Limit depth to avoid scanning too deep (max 10 levels)
    if (depth > 10) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            if (entry.name === '.cursor') {
              // Check if directory is older than 1 day
              const stats = await fs.stat(fullPath);
              const mtime = stats.mtime.getTime();
              
              if (mtime < oneDayAgo) {
                results.push(fullPath);
              }
            } else if (!entry.name.startsWith('.')) {
              // Only recurse into non-hidden directories to avoid excessive scanning
              await scanDir(fullPath, depth + 1);
            }
          }
        } catch (err) {
          // Ignore permission errors or inaccessible paths
          if ((err as NodeJS.ErrnoException).code !== 'EACCES' && 
              (err as NodeJS.ErrnoException).code !== 'ENOENT') {
            // Only log unexpected errors
          }
        }
      }
    } catch (err) {
      // Ignore permission errors
      if ((err as NodeJS.ErrnoException).code !== 'EACCES') {
        // Skip inaccessible directories
      }
    }
  }

  // Start scanning from home directory
  await scanDir(homeDir);
  return results;
}

async function getDirSize(dirPath: string): Promise<string> {
  try {
    let totalSize = 0;
    
    async function calculateSize(currentPath: string): Promise<void> {
      try {
        const stats = await fs.stat(currentPath);
        if (stats.isFile()) {
          totalSize += stats.size;
        } else if (stats.isDirectory()) {
          const entries = await fs.readdir(currentPath);
          for (const entry of entries) {
            await calculateSize(path.join(currentPath, entry));
          }
        }
      } catch {
        // Ignore errors
      }
    }
    
    await calculateSize(dirPath);
    
    // Format size in human-readable format
    const kb = totalSize / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;
    
    if (gb >= 1) {
      return `${gb.toFixed(2)}G`;
    } else if (mb >= 1) {
      return `${mb.toFixed(2)}M`;
    } else if (kb >= 1) {
      return `${kb.toFixed(2)}K`;
    }
    return `${totalSize}B`;
  } catch {
    return '?';
  }
}

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    console.log('Usage: tsx scripts/maintenance/cleanup-cursor.ts [--delete] [--archive DIR] [--help]');
    console.log('');
    console.log('Options:');
    console.log('  --delete          Delete found directories (default: preview only)');
    console.log('  --archive DIR     Move directories to archive directory instead of deleting');
    console.log('  --help            Show this help message');
    process.exit(0);
  }

  const homeDir = os.homedir();
  console.log(`🔍 Scanning for .cursor directories older than 1 day under ${homeDir}...`);

  try {
    const results = await findCursorDirs(homeDir);

    if (results.length === 0) {
      console.log('✅ No .cursor directories older than 1 day found.');
      process.exit(0);
    }

    console.log(`\n📦 Found ${results.length} .cursor directory(ies):`);
    for (const dir of results) {
      const size = await getDirSize(dir);
      console.log(`  ${size}\t${dir}`);
    }

    if (opts.delete || opts.archive) {
      if (opts.archive) {
        // Ensure archive directory exists
        await fs.mkdir(opts.archive, { recursive: true });
        console.log(`\n📦 Archiving to ${opts.archive}...`);
        
        for (const dir of results) {
          const dirName = path.basename(dir);
          const archivePath = path.join(opts.archive, dirName);
          
          try {
            // If target exists, remove it first
            try {
              await fs.rm(archivePath, { recursive: true, force: true });
            } catch {}
            
            await fs.rename(dir, archivePath);
            console.log(`  ✅ Archived: ${dir} → ${archivePath}`);
          } catch (err) {
            console.error(`  ❌ Failed to archive ${dir}: ${(err as Error).message}`);
            // Try to delete if archive fails
            try {
              await fs.rm(dir, { recursive: true, force: true });
              console.log(`  ✅ Deleted instead: ${dir}`);
            } catch {
              console.error(`  ❌ Also failed to delete ${dir}`);
            }
          }
        }
      } else {
        console.log(`\n🗑️  Deleting ${results.length} directory(ies)...`);
        
        for (const dir of results) {
          try {
            await fs.rm(dir, { recursive: true, force: true });
            console.log(`  ✅ Deleted: ${dir}`);
          } catch (err) {
            console.error(`  ❌ Failed to delete ${dir}: ${(err as Error).message}`);
          }
        }
      }
      console.log('\n✅ Done.');
    } else {
      console.log('\n💡 Preview only. Rerun with --delete to remove or --archive DIR to move them to an archive directory.');
    }
  } catch (err) {
    console.error('❌ Error:', (err as Error).message);
    process.exit(1);
  }
}

void main();

