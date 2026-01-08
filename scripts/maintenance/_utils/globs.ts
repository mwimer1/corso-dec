import { globby } from 'globby';

function toPosix(p: string): string { return p.replace(/\\/g, '/'); }

export async function findMarkdownFiles(
  patterns: string[] = ['**/*.md', '**/*.mdx'],
  ignore: string[] = ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/coverage/**', '**/.turbo/**', '**/.cache/**']
): Promise<string[]> {
  const files = await globby(patterns, { gitignore: true, ignore });
  return files.map(toPosix);
}



