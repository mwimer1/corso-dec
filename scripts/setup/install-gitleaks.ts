#!/usr/bin/env tsx

import { spawnSync } from 'child_process';

function run(cmd: string, args: string[]) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return res.status === 0;
}

function main() {
  const platform = process.platform;
  console.log('🔧 Installing gitleaks...');

  if (platform === 'win32') {
    // Prefer winget; fallback to choco
    console.log('Detected Windows. Trying winget...');
    const okWinget = run('powershell', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      'winget install --id Gitleaks.Gitleaks --silent',
    ]);
    if (okWinget) {
      console.log('✅ gitleaks installed via winget');
      process.exit(0);
    }

    console.log('winget failed or unavailable. Trying Chocolatey...');
    const okChoco = run('powershell', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      'choco install gitleaks -y',
    ]);
    if (okChoco) {
      console.log('✅ gitleaks installed via Chocolatey');
      process.exit(0);
    }

    console.error('❌ Failed to install gitleaks via winget and Chocolatey.');
    console.error('   How to fix: Ensure winget or Chocolatey is installed and on PATH.');
    process.exit(1);
  }

  // Linux/macOS: official install script
  console.log('Detected Unix-like OS. Using official install script...');
  const okCurl = run('bash', [
    '-lc',
    'curl -sSL https://raw.githubusercontent.com/gitleaks/gitleaks/master/install.sh | bash',
  ]);
  if (okCurl) {
    console.log('✅ gitleaks installed');
    process.exit(0);
  }

  console.error('❌ Failed to install gitleaks via install script.');
  console.error('   How to fix: Visit https://github.com/gitleaks/gitleaks/releases for manual install.');
  process.exit(1);
}

main();



