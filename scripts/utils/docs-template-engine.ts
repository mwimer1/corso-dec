#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import handlebars from 'handlebars';

export type DocsContext = Record<string, unknown>;

const ROOT = process.cwd();
const PRIMARY_TPL_DIR = path.join(ROOT, 'docs', '_scripts', 'templates');
const LEGACY_TPL_DIR = path.join(ROOT, 'scripts', 'docs', 'templates');

function resolveTemplateDir(): string {
  if (fs.existsSync(PRIMARY_TPL_DIR)) return PRIMARY_TPL_DIR;
  if (fs.existsSync(LEGACY_TPL_DIR)) return LEGACY_TPL_DIR;
  return PRIMARY_TPL_DIR;
}

export function renderReadme(templateName: string, context: DocsContext): string {
  const tplDir = resolveTemplateDir();
  const tplPath = path.join(tplDir, `${templateName}.hbs`);
  const src = fs.readFileSync(tplPath, 'utf8');
  const tpl = handlebars.compile(src, { noEscape: false, strict: false });
  return tpl(context);
}

/**
 * Normalizes content by removing last_updated from frontmatter for comparison
 * This prevents timestamp-only rewrites from triggering file writes
 */
function normalizeContentForComparison(content: string): string {
  // Check if content has frontmatter
  if (!content.startsWith('---')) {
    return content;
  }
  
  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return content;
  }
  
  const frontmatterStart = 3; // Skip opening ---
  const frontmatterEnd = endIndex;
  const frontmatterContent = content.slice(frontmatterStart, frontmatterEnd);
  const restOfContent = content.slice(endIndex + 4); // Skip closing ---\n
  
  // Remove last_updated lines from frontmatter
  const normalizedFrontmatter = frontmatterContent
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('last_updated:') && trimmed.length > 0;
    })
    .join('\n');
  
  // Reconstruct without last_updated
  return `---\n${normalizedFrontmatter}\n---${restOfContent}`;
}

export function writeIfChanged(filePath: string, content: string): boolean {
  const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  
  // First check exact match (fast path)
  if (prev === content) return false;
  
  // Compare normalized content (without last_updated) to avoid timestamp-only rewrites
  const normalizedPrev = normalizeContentForComparison(prev);
  const normalizedContent = normalizeContentForComparison(content);
  
  if (normalizedPrev === normalizedContent) {
    // Only timestamp changed, skip write
    return false;
  }
  
  // Content actually changed, write it
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

export function findReadmes(): string[] {
  // Central pattern list; extend only here (no copy-paste in other scripts)
  // Note: hooks/ and contexts/ directories no longer exist at root level.
  // Hooks have been moved to domain homes (components/ui/hooks/, components/chat/hooks/, etc.)
  return [
    'README.md',
    'scripts/**/README.md',
    'lib/**/README.md',
    'components/**/README.md',
    'types/**/README.md',
    'styles/**/README.md',
    'docs/**/README.md',
  ];
}

