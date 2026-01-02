#!/usr/bin/env tsx
/**
 * Cross-platform script to check and kill processes on specified ports
 * 
 * Usage:
 *   tsx scripts/maintenance/ensure-ports.ts                      # Default ports: 3000, 6006, 9323
 *   tsx scripts/maintenance/ensure-ports.ts --ports 3000 8080    # Specific ports
 *   tsx scripts/maintenance/ensure-ports.ts --kill-only          # Kill and exit
 *   tsx scripts/maintenance/ensure-ports.ts --help               # Show help
 */

import { execSync } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';

interface Options {
  ports: number[];
  killOnly: boolean;
  help: boolean;
}

const DEFAULT_PORTS = {
  dev: 3000,
  playwright: 9323,
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = {
    ports: [],
    killOnly: false,
    help: false,
  };

  // Check if first arguments are port numbers
  const firstNonFlagIndex = args.findIndex(arg => !arg.startsWith('--'));
  if (firstNonFlagIndex >= 0 && args[firstNonFlagIndex] !== '--ports') {
    // Parse ports as positional arguments
    const portArgs = args.slice(firstNonFlagIndex);
    for (const arg of portArgs) {
      if (arg.startsWith('--')) break;
      const port = parseInt(arg, 10);
      if (!isNaN(port) && port > 0 && port <= 65535) {
        opts.ports.push(port);
      }
    }
    args.splice(firstNonFlagIndex, portArgs.length);
  }

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--ports') {
      // Continue reading ports after --ports flag
      while (i + 1 < args.length && !args[i + 1]?.startsWith('--')) {
        const nextArg = args[++i];
        if (nextArg) {
          const port = parseInt(nextArg, 10);
          if (!isNaN(port) && port > 0 && port <= 65535) {
            opts.ports.push(port);
          }
        }
      }
    } else if (arg === '--DevPort' || arg === '--dev-port') {
      if (i + 1 < args.length) {
        const nextArg = args[++i];
        if (nextArg) {
          const port = parseInt(nextArg, 10);
          if (!isNaN(port) && port > 0) {
            opts.ports.push(port);
          }
        }
      }
    } else if (arg === '--PlaywrightPort' || arg === '--playwright-port') {
      if (i + 1 < args.length) {
        const nextArg = args[++i];
        if (nextArg) {
          const port = parseInt(nextArg, 10);
          if (!isNaN(port) && port > 0) {
            opts.ports.push(port);
          }
        }
      }
    } else if (arg === '--KillOnly' || arg === '--kill-only') {
      opts.killOnly = true;
    } else if (arg === '--help') {
      opts.help = true;
    } else {
      console.error(`❌ Unknown argument: ${arg}`);
      console.error('Usage: tsx scripts/maintenance/ensure-ports.ts [--ports PORT...] [--kill-only] [--help]');
      process.exit(1);
    }
  }

  // If no ports specified, use defaults
  if (opts.ports.length === 0) {
    opts.ports = [DEFAULT_PORTS.dev, DEFAULT_PORTS.playwright];
  }

  // Remove duplicates and sort
  opts.ports = [...new Set(opts.ports)].sort((a, b) => a - b);

  return opts;
}

function getProcessesOnPortWindows(port: number): number[] {
  const pids: number[] = [];
  
  try {
    // Use netstat to find processes on port
    const output = execSync(
      `netstat -ano | findstr ":${String(port)}"`,
      { encoding: 'utf8', maxBuffer: 1024 * 1024 }
    );

    const lines = output.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pidStr = parts[parts.length - 1];
        if (pidStr) {
          const pid = parseInt(pidStr, 10);
          if (!isNaN(pid) && pid > 0) {
            pids.push(pid);
          }
        }
      }
    }
  } catch {
    // Port might not be in use, or netstat failed
  }

  return [...new Set(pids)];
}

function getProcessesOnPortUnix(port: number): number[] {
  const pids: number[] = [];
  
  try {
    // Use lsof to find processes on port (most reliable on Unix)
    const output = execSync(
      `lsof -ti:${String(port)}`,
      { encoding: 'utf8', maxBuffer: 1024 * 1024 }
    );

    const pidStrings = output.trim().split('\n').filter(s => s.trim());
    for (const pidStr of pidStrings) {
      const pid = parseInt(pidStr, 10);
      if (!isNaN(pid) && pid > 0) {
        pids.push(pid);
      }
    }
  } catch {
    // Port might not be in use, or lsof failed
    // Fallback: Use Node.js net module to check if port is in use
    // (This doesn't give us PIDs, but we can at least detect usage)
    // Note: The isPortInUse function already handles this, so we rely on that
    // for the "port in use" check. This function is only called when we need PIDs.
    // If lsof fails, we return empty array (port likely not in use or no permission)
  }

  return [...new Set(pids)];
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

function killPort(port: number, platform: string): void {
  const pids = platform === 'win32' 
    ? getProcessesOnPortWindows(port)
    : getProcessesOnPortUnix(port);

  if (pids.length === 0) {
    return;
  }

  for (const pid of pids) {
    console.log(`⚠️  Killing PID ${String(pid)} on port ${String(port)}`);
    if (!killProcess(pid, platform)) {
      console.error(`❌ Failed to kill PID ${String(pid)} on port ${String(port)}`);
    }
  }
}

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port, () => {
      server.close();
      resolve(false);
    });
  });
}

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    console.log('Usage: tsx scripts/maintenance/ensure-ports.ts [OPTIONS]');
    console.log('');
    console.log('Options:');
    console.log('  [PORT...]              Port numbers to check (default: 3000, 9323)');
    console.log('  --ports PORT...        Specify ports explicitly');
    console.log('  --DevPort PORT         Set dev port (3000)');
    console.log('  --PlaywrightPort PORT  Set playwright port (9323)');
    console.log('  --kill-only            Kill processes and exit (don\'t wait)');
    console.log('  --help                 Show this help message');
    console.log('');
    console.log('This script kills processes using the specified ports, making them');
    console.log('available for development servers.');
    process.exit(0);
  }

  if (opts.ports.length === 0) {
    console.error('❌ No valid ports provided.');
    process.exit(1);
  }

  const platform = os.platform();

  // Kill processes on each port
  for (const port of opts.ports) {
    killPort(port, platform);
  }

  if (opts.killOnly) {
    console.log('✅ Ports cleared only. Done.');
    process.exit(0);
  }

  // Wait a moment for ports to be released
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify ports are available
  let allClear = true;
  for (const port of opts.ports) {
    const inUse = await isPortInUse(port);
    if (inUse) {
      console.warn(`⚠️  Port ${port} may still be in use`);
      allClear = false;
    }
  }

  if (allClear) {
    console.log('✅ Ports cleared. Continuing…');
  } else {
    console.log('⚠️  Some ports may still be in use. Continuing anyway…');
  }
}

void main();

