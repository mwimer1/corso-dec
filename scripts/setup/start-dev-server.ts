#!/usr/bin/env tsx
// scripts/setup/start-dev-server.ts
// Consolidated, cross-platform script to start the dev server.

import { spawn } from 'child_process';
import { platform } from 'os';

// A simple utility to check if a port is in use.
// For a real-world scenario, a library like 'is-port-reachable' would be more robust.
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const command = platform() === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;

    const proc = spawn(command, { shell: true });

    proc.on('exit', (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  console.log('🚀 Starting Corso Dev Server...');

  const ports = [3000, 3001];
  let isRunning = false;

  for (const port of ports) {
    if (await isPortInUse(port)) {
      console.log(`✅ Dev server already running on port ${port}`);
      console.log(`🌐 Visit: http://localhost:${port}`);
      isRunning = true;
      break;
    }
  }

  if (isRunning) {
    process.exit(0);
  }

  console.log('⏳ Starting Next.js dev server...');
  const devProcess = spawn('pnpm', ['dev'], {
    detached: true,
    stdio: 'ignore',
  });
  devProcess.unref();

  console.log('Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  let serverStarted = false;
  for (const port of ports) {
    if (await isPortInUse(port)) {
      console.log(`✅ Dev server started on http://localhost:${port}`);
      serverStarted = true;
      break;
    }
  }

  if (serverStarted) {
    console.log('🎉 Ready for development!');
    process.exit(0);
  } else {
    console.error('❌ Dev server failed to start');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});

