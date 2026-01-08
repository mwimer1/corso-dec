import path from 'path';
import type { Project } from 'ts-morph';

export function resolvePathAlias(importPath: string, project: Project): string {
  if (!importPath.startsWith('@/')) return importPath;

  // Simple implementation - resolve @/ to project root
  const tsConfig = project.getCompilerOptions();
  const baseUrl = tsConfig.baseUrl ?? '.';
  return path.resolve(baseUrl, importPath.slice(2));
}

export function isNextJsRoute(filePath: string): boolean {
  return /app\/.*\/(route|page|layout|loading|error|not-found|opengraph-image|icon|sitemap)\.(ts|tsx|js|jsx)$/.test(filePath);
}

export function isStyleFile(filePath: string): boolean {
  return /\.(css|scss|sass|less|styl)$/.test(filePath) ||
         filePath.includes('tailwind.config.') ||
         filePath.includes('postcss.config.');
}

export function isBarrelFile(filePath: string): boolean {
  return /\/index\.(ts|tsx|js|jsx)$/.test(filePath) ||
         filePath.endsWith('.ts') && filePath.includes('/index');
}

export function findDynamicImports(content: string): string[] {
  const dynamicImports: string[] = [];

  // Find ES6 dynamic imports: import('./module')
  const es6Regex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;
  while ((match = es6Regex.exec(content)) !== null) {
    if (match[1]) dynamicImports.push(match[1]);
  }

  // Find CommonJS require calls: require('./module')
  const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    if (match[1]) dynamicImports.push(match[1]);
  }

  return dynamicImports;
}

export async function analyzeFile(
  filePath: string,
  project: Project,
  allowlist: Set<string>
): Promise<{
  status: 'KEEP' | 'DROP';
  reasons: string[];
  exportRefs?: Array<{ export: string; references: Array<{ file: string; line: number }> }>;
}> {
  const reasons: string[] = [];

  // Check if file is in allowlist
  if (allowlist.has(filePath)) {
    reasons.push('KEEP_ALLOWLIST');
    return { status: 'KEEP', reasons };
  }

  // Check if it's a Next.js route (implicit keep)
  if (isNextJsRoute(filePath)) {
    reasons.push('KEEP_ROUTES_IMPLICIT');
    return { status: 'KEEP', reasons };
  }

  // Check if it's a barrel file that's being used
  if (isBarrelFile(filePath)) {
    const sourceFile = project.getSourceFile(filePath);
    if (sourceFile) {
      const exports = sourceFile.getExportedDeclarations();
      const hasReferences = Array.from(exports.values()).some(declarations =>
        declarations.length > 0
      );
      if (hasReferences) {
        reasons.push('KEEP_BARREL_USED');
        return { status: 'KEEP', reasons };
      }
    }
  }

  // Check for dynamic imports
  const sourceFile = project.getSourceFile(filePath);
  if (sourceFile) {
    const content = sourceFile.getFullText();
    const dynamicImports = findDynamicImports(content);
    if (dynamicImports.length > 0) {
      reasons.push('KEEP_DYNAMIC_IMPORT');
      return { status: 'KEEP', reasons };
    }
  }

  return { status: 'DROP', reasons };
}

export function findTextReferences(filePath: string, searchDirs: string[]): boolean {
  // Simple implementation - would need actual file reading
  // For now, return false as placeholder
  return false;
}


