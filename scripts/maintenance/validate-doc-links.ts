import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
let exitCode = 0;

async function validateDocLinks() {
  // Scan common documentation locations, including root README and GitHub READMEs
  const markdownFiles = await glob(
    [
      `${projectRoot}/README.md`,
      `${projectRoot}/docs/**/*.md`,
      `${projectRoot}/.github/**/*.md`,  // Include GitHub directory READMEs
      `${projectRoot}/eslint-plugin-corso/**/*.md`,  // Include ESLint plugin READMEs
      `${projectRoot}/stories/**/*.md`,  // Include Stories directory READMEs
      `${projectRoot}/styles/**/*.md`,  // Include Styles directory READMEs
      `${projectRoot}/.vscode/**/*.md`,  // Include VSCode directory READMEs
      `${projectRoot}/.storybook/**/*.md`,  // Include Storybook directory READMEs
      `${projectRoot}/public/**/*.md`,  // Include Public assets directory READMEs
      `${projectRoot}/.husky/**/*.md`,  // Include Husky hooks directory READMEs
      `${projectRoot}/.cursor/**/*.md`,  // Include Cursor AI rules directory READMEs
      `${projectRoot}/lib/**/*.md`,
      `${projectRoot}/components/**/*.md`,
      `${projectRoot}/hooks/**/*.md`,
      `${projectRoot}/app/**/*.md`,
    ],
    { windowsPathsNoEscape: true }
  );

  for (const file of markdownFiles) {
    const content = readFileSync(file, 'utf-8');
    const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

    for (const link of links) {
      const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(link);
      if (match?.[2]) {
        const original = match[2];
        // Skip external links and anchors/mailto
        if (/^(https?:)?\/\//.test(original) || original.startsWith('#') || original.startsWith('mailto:')) {
          continue;
        }
        // Strip URL fragments and query strings for filesystem resolution
        const safe = String(original ?? '');
        const withoutFragment = (safe && safe.includes('#')) ? (safe.split('#')[0] ?? safe) : safe;
        const withoutQuery = (withoutFragment && withoutFragment.includes('?')) ? (withoutFragment.split('?')[0] ?? withoutFragment) : withoutFragment;
        const resolvedTarget: string = withoutQuery;
        if (!resolvedTarget) continue;
        if (!withoutFragment) continue;
        // Support root-absolute paths like "/docs/..."
        const absolutePath = resolvedTarget.startsWith('/')
          ? path.resolve(projectRoot, resolvedTarget.replace(/^\//, ''))
          : path.resolve(path.dirname(file), resolvedTarget);
        if (!existsSync(absolutePath)) {
          console.error(`❌ Broken link in ${file}: ${original}`);
          exitCode = 1;
        }
      }
    }
  }
}

async function main() {
  console.log('Validating documentation links...');
  await validateDocLinks();

  if (exitCode === 0) {
    console.log('✅ All documentation links are valid.');
  } else {
    console.log('🔥 Documentation link validation failed.');
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error('Failed to validate documentation links:', error);
  process.exit(1);
});

