#!/usr/bin/env tsx
/**
 * Cross-platform script to kill orphaned Node.js processes
 * 
 * Kills processes matching development patterns (next dev, storybook, vitest, etc.)
 * that are older than a specified age and don't have active parent processes.
 * 
 * Usage:
 *   tsx scripts/maintenance/kill-orphans.ts                    # Default: 480 minutes (8 hours)
 *   tsx scripts/maintenance/kill-orphans.ts --max-age 240      # 240 minutes (4 hours)
 *   tsx scripts/maintenance/kill-orphans.ts --help             # Show help
 */

import { execSync } from 'node:child_process';
import os from 'node:os';

interface ProcessInfo {
  pid: number;
  commandLine: string;
  startTime: Date;
  parentPid: number | undefined;
}

interface Options {
  maxAgeMinutes: number;
  help: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = {
    maxAgeMinutes: 480, // Default: 8 hours
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--max-age' || arg === '--MaxAgeMinutes') {
      if (i + 1 < args.length) {
        const nextArg = args[++i];
        if (nextArg) {
          const value = parseInt(nextArg, 10);
          if (!isNaN(value) && value > 0) {
            opts.maxAgeMinutes = value;
          } else {
            console.error('❌ --max-age must be a positive number');
            process.exit(1);
          }
        } else {
          console.error('❌ --max-age requires a number');
          process.exit(1);
        }
      } else {
        console.error('❌ --max-age requires a number');
        process.exit(1);
      }
    } else if (arg === '--help') {
      opts.help = true;
    } else {
      console.error(`❌ Unknown argument: ${arg}`);
      console.error('Usage: tsx scripts/maintenance/kill-orphans.ts [--max-age MINUTES] [--help]');
      process.exit(1);
    }
  }

  return opts;
}

function getProcessesWindows(): ProcessInfo[] {
  const processes: ProcessInfo[] = [];
  
  try {
    // Use wmic to get process information
    const output = execSync(
      'wmic process where "name=\'node.exe\' OR name=\'deno.exe\'" get ProcessId,CommandLine,CreationDate,ParentProcessId /format:csv',
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = output.split('\n').filter(line => line.trim() && !line.startsWith('Node'));
    const pattern = /(next\s+dev|storybook|vitest|tsc\s+-w|tsx\s+watch|nodemon)/i;

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 5) {
        const commandLine = parts[parts.length - 3] || '';
        const pidStr = parts[parts.length - 4];
        const parentPidStr = parts[parts.length - 2];
        const creationDate = parts[parts.length - 1]?.trim();
        
        if (!pidStr || !creationDate) continue;
        
        const pid = parseInt(pidStr, 10);
        const parentPid = parentPidStr ? parseInt(parentPidStr, 10) : undefined;

        if (pattern.test(commandLine) && !isNaN(pid) && creationDate) {
          try {
            // Parse WMI date format: YYYYMMDDHHmmss.ffffff+UUU
            const year = parseInt(creationDate.substring(0, 4), 10);
            const month = parseInt(creationDate.substring(4, 6), 10) - 1;
            const day = parseInt(creationDate.substring(6, 8), 10);
            const hour = parseInt(creationDate.substring(8, 10), 10);
            const minute = parseInt(creationDate.substring(10, 12), 10);
            const second = parseInt(creationDate.substring(12, 14), 10);

            const startTime = new Date(year, month, day, hour, minute, second);

            processes.push({
              pid,
              commandLine,
              startTime,
              parentPid: !isNaN(parentPid ?? NaN) ? parentPid! : undefined,
            });
          } catch {
            // Skip processes with unparseable dates
          }
        }
      }
    }
  } catch (err) {
    // If wmic fails, try alternative approach using tasklist and PowerShell
    try {
      const tasklistOutput = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH', {
        encoding: 'utf8',
      });

      // This approach is more limited but works as fallback
      // We can't easily get command line and creation time with tasklist alone
      // So we skip this fallback and just return empty array
    } catch {
      // Ignore errors
    }
  }

  return processes;
}

function getProcessesUnix(): ProcessInfo[] {
  const processes: ProcessInfo[] = [];
  
  try {
    // Use ps to get process information
    const output = execSync(
      'ps -eo pid,ppid,lstart,args --no-headers',
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = output.split('\n');
    const pattern = /(next\s+dev|storybook|vitest|tsc\s+-w|tsx\s+watch|nodemon)/i;
    const nodePattern = /node|deno/;

    for (const line of lines) {
      if (!nodePattern.test(line)) continue;
      
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\w+)\s+(\d+)\s+(\d+):(\d+):(\d+)\s+(\d+)\s+(.+)$/);
      if (match && pattern.test(line)) {
        const pidStr = match[1];
        const parentPidStr = match[2];
        const monthStr = match[3];
        const dayStr = match[4];
        const hourStr = match[5];
        const minuteStr = match[6];
        const secondStr = match[7];
        const yearStr = match[8];
        const commandLine = match[9];
        
        if (!pidStr || !parentPidStr || !monthStr || !dayStr || !hourStr || !minuteStr || !secondStr || !yearStr || !commandLine) continue;
        
        const pid = parseInt(pidStr, 10);
        const parentPid = parseInt(parentPidStr, 10);
        const day = parseInt(dayStr, 10);
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        const second = parseInt(secondStr, 10);
        const year = parseInt(yearStr, 10);

        const monthMap: Record<string, number> = {
          Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
          Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
        };

        const month = monthMap[monthStr] ?? 0;
        const startTime = new Date(year, month, day, hour, minute, second);

        processes.push({
          pid,
          commandLine,
          startTime,
          parentPid,
        });
      }
    }
  } catch (err) {
    console.warn('⚠️  Could not get process list:', (err as Error).message);
  }

  return processes;
}

function getParentProcessName(pid: number, platform: string): string | null {
  try {
    if (platform === 'win32') {
      const output = execSync(
        `wmic process where "ProcessId=${String(pid)}" get Name /format:csv`,
        { encoding: 'utf8', maxBuffer: 1024 * 1024 }
      );
      const lines = output.split('\n').filter(l => l.trim() && !l.startsWith('Node'));
      if (lines.length > 0 && lines[0]) {
        const parts = lines[0].split(',');
        const lastPart = parts[parts.length - 1];
        return lastPart?.trim() || null;
      }
    } else {
      const output = execSync(`ps -p ${String(pid)} -o comm=`, {
        encoding: 'utf8',
        maxBuffer: 1024,
      });
      return output.trim() || null;
    }
  } catch {
    return null;
  }
  
  return null;
}

function killProcess(pid: number, platform: string): boolean {
  try {
    if (platform === 'win32') {
      execSync(`taskkill /PID ${String(pid)} /F`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
      // Give it a moment, then force kill if still running
      setTimeout(() => {
        try {
          process.kill(pid, 0); // Check if process exists
          process.kill(pid, 'SIGKILL');
        } catch {
          // Process already terminated
        }
      }, 1000);
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    console.log('Usage: tsx scripts/maintenance/kill-orphans.ts [--max-age MINUTES] [--help]');
    console.log('');
    console.log('Options:');
    console.log('  --max-age MINUTES  Maximum age in minutes before killing (default: 480)');
    console.log('  --help             Show this help message');
    console.log('');
    console.log('This script kills orphaned Node.js/Deno processes matching development');
    console.log('patterns (next dev, storybook, vitest, etc.) that are older than the');
    console.log('specified age and don\'t have active parent processes.');
    process.exit(0);
  }

  const platform = os.platform();
  const processes = platform === 'win32' ? getProcessesWindows() : getProcessesUnix();

  if (processes.length === 0) {
    console.log('✅ No matching processes found.');
    process.exit(0);
  }

  const now = new Date();
  const maxAgeMs = opts.maxAgeMinutes * 60 * 1000;

  // Parent processes to keep (active dev sessions)
  const keepParents = platform === 'win32'
    ? ['Code.exe', 'cursor.exe', 'pwsh.exe', 'powershell.exe', 'WindowsTerminal.exe', 'conhost.exe', 'git-bash.exe']
    : ['code', 'cursor', 'zsh', 'bash', 'fish', 'terminal'];

  let killedCount = 0;

  for (const proc of processes) {
    const age = (now.getTime() - proc.startTime.getTime()) / (60 * 1000); // Age in minutes
    const isOld = age >= opts.maxAgeMinutes;

    if (!isOld) continue;

    // Check parent process
    let hasActiveParent = false;
    if (proc.parentPid) {
      const parentName = getParentProcessName(proc.parentPid, platform);
      if (parentName && keepParents.some(keep => parentName.toLowerCase().includes(keep.toLowerCase()))) {
        hasActiveParent = true;
      }
    }

    if (!hasActiveParent) {
      const ageMinutes = Math.floor(age);
      const cmdPreview = proc.commandLine.substring(0, 80);
      console.log(`⚠️  Killing orphan PID ${String(proc.pid)} (${String(ageMinutes)}m old): ${cmdPreview}`);
      
      if (killProcess(proc.pid, platform)) {
        killedCount++;
      } else {
        console.error(`❌ Failed to kill PID ${String(proc.pid)}`);
      }
    }
  }

  if (killedCount > 0) {
    console.log(`✅ Orphan cleanup done. Killed ${killedCount} process(es).`);
  } else {
    console.log('✅ No orphaned processes found to kill.');
  }
}

void main();

