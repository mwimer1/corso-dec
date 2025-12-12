// scripts/validate-effect-deps.ts
import { exec } from 'child_process';
import { fileURLToPath } from 'node:url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function main() {
  const eslintCommand = `eslint -c scripts/eslint-deps-check.config.js hooks/`;

  exec(eslintCommand, { cwd: ROOT_DIR }, (error, stdout, stderr) => {
    if (error) {
      console.error('Exhaustive-deps check failed:');
      console.error(stderr);
      console.log(stdout);
      process.exit(1);
    }

    if (stdout) {
      console.log(stdout);
    }

    console.log('Exhaustive-deps check passed.');
  });
}

main(); 

