#!/usr/bin/env tsx
/**
 * Generate Table of Contents for environment variables documentation
 * 
 * Extracts environment variables from ValidatedEnv type and generates
 * a TOC for docs/references/env.md
 * 
 * Usage:
 *   pnpm run docs:env:toc
 *   tsx scripts/maintenance/generate-env-docs-toc.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const ENV_DOCS_PATH = path.join(ROOT, 'docs', 'references', 'env.md');

interface EnvVarInfo {
  name: string;
  category: 'public' | 'server' | 'build' | 'integration' | 'feature';
  description?: string;
}

/**
 * Categorize environment variable
 */
function categorizeEnvVar(name: string): EnvVarInfo['category'] {
  if (name.startsWith('NEXT_PUBLIC_')) {
    return 'public';
  }
  if (name.startsWith('NODE_') || name.startsWith('NEXT_') || name.startsWith('VERCEL_')) {
    return 'build';
  }
  if (name.includes('CLICKHOUSE') || name.includes('SUPABASE') || name.includes('STRIPE') || 
      name.includes('OPENAI') || name.includes('CLERK') || name.includes('DIRECTUS') || 
      name.includes('SENTRY') || name.includes('TURNSTILE') || name.includes('UPSTASH')) {
    return 'integration';
  }
  if (name.includes('MOCK') || name.includes('CMS') || name.includes('AI_') || 
      name.includes('AUTH_') || name.includes('PRESENCE_')) {
    return 'feature';
  }
  return 'server';
}

/**
 * Extract environment variables from ValidatedEnv implementation
 */
function extractEnvVars(): EnvVarInfo[] {
  const envFile = path.join(ROOT, 'lib', 'server', 'env.ts');
  if (!existsSync(envFile)) {
    throw new Error('Could not find lib/server/env.ts');
  }

  const content = readFileSync(envFile, 'utf8');
  const envVars: EnvVarInfo[] = [];

  // Extract from patterns like: KEY: g('KEY')
  const simplePattern = /([A-Z_][A-Z0-9_]*):\s*g\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g;
  let match;
  while ((match = simplePattern.exec(content)) !== null) {
    const varName = match[2] || match[1];
    if (varName && !envVars.some(v => v.name === varName)) {
      envVars.push({
        name: varName,
        category: categorizeEnvVar(varName),
      });
    }
  }

  // Extract from nested patterns (like CORSO_USE_MOCK_DB)
  const nestedPattern = /([A-Z_][A-Z0-9_]*):\s*\(\(\)\s*=>\s*\{[^}]*g\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g;
  while ((match = nestedPattern.exec(content)) !== null) {
    const varName = match[2] || match[1];
    if (varName && !envVars.some(v => v.name === varName)) {
      envVars.push({
        name: varName,
        category: categorizeEnvVar(varName),
      });
    }
  }

  // Also check for direct g('VAR') patterns that might be missed
  const directPattern = /g\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g;
  const seen = new Set(envVars.map(v => v.name));
  while ((match = directPattern.exec(content)) !== null) {
    const varName = match[1];
    if (varName && !seen.has(varName) && !varName.startsWith('_')) {
      envVars.push({
        name: varName,
        category: categorizeEnvVar(varName),
      });
      seen.add(varName);
    }
  }

  return envVars.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generate TOC markdown
 */
function generateTOC(envVars: EnvVarInfo[]): string {
  const categories: Record<EnvVarInfo['category'], EnvVarInfo[]> = {
    public: [],
    server: [],
    build: [],
    integration: [],
    feature: [],
  };

  for (const envVar of envVars) {
    categories[envVar.category].push(envVar);
  }

  const toc: string[] = [];
  toc.push('## Table of Contents');
  toc.push('');

  const categoryLabels: Record<EnvVarInfo['category'], string> = {
    public: 'Public Variables (NEXT_PUBLIC_*)',
    server: 'Server Variables',
    build: 'Build/Runtime Variables',
    integration: 'Integration Variables',
    feature: 'Feature Flags & Configuration',
  };

  for (const [category, vars] of Object.entries(categories)) {
    if (vars.length === 0) continue;

    toc.push(`### ${categoryLabels[category as EnvVarInfo['category']]}`);
    toc.push('');
    for (const envVar of vars) {
      // Generate anchor link (markdown converts headings to lowercase)
      // Most markdown parsers keep underscores in anchors, but some convert to hyphens
      // We'll use lowercase with underscores to match standard markdown behavior
      const anchor = envVar.name.toLowerCase();
      toc.push(`- [${envVar.name}](#${anchor})`);
    }
    toc.push('');
  }

  return toc.join('\n');
}

/**
 * Extract documented environment variables from env.md
 * Matches both ## VARIABLE_NAME and ### VARIABLE_NAME headings
 */
function extractDocumentedEnvVars(content: string): Set<string> {
  const documented = new Set<string>();
  // Match headings like "## VARIABLE_NAME" or "### VARIABLE_NAME"
  // Only match if it's a valid env var name (all caps with underscores)
  const headingPattern = /^#{2,3} ([A-Z_][A-Z0-9_]*)$/gm;
  let match;
  while ((match = headingPattern.exec(content)) !== null) {
    const varName = match[1]!;
    // Only include if it looks like an env var (all caps, underscores, no spaces)
    // Exclude section headings like "Edge Cases", "Environment Access", etc.
    if (varName === varName.toUpperCase() && !varName.includes(' ')) {
      documented.add(varName);
    }
  }
  return documented;
}

/**
 * Insert or update TOC in env.md
 */
function updateEnvDocsTOC(): void {
  if (!existsSync(ENV_DOCS_PATH)) {
    console.warn(`⚠️  Environment docs file not found: ${ENV_DOCS_PATH}`);
    console.warn('   Creating new file...');
    writeFileSync(ENV_DOCS_PATH, '# Environment Variables Reference\n\n', 'utf8');
  }

  const content = readFileSync(ENV_DOCS_PATH, 'utf8');
  const allEnvVars = extractEnvVars();
  const documentedVars = extractDocumentedEnvVars(content);
  
  // Filter to only include documented variables
  const envVars = allEnvVars.filter(v => documentedVars.has(v.name));
  
  if (envVars.length === 0) {
    console.warn('⚠️  No documented environment variables found in env.md');
    console.warn('   TOC will be empty. Document variables using "## VARIABLE_NAME" headings.');
    return;
  }
  
  const toc = generateTOC(envVars);

  // Check if TOC already exists
  const tocStartPattern = /^## Table of Contents/m;
  const tocEndPattern = /^## [A-Z_][A-Z0-9_]*/m;

  if (tocStartPattern.test(content)) {
    // Replace existing TOC
    const lines = content.split('\n');
    let tocStart = -1;
    let tocEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      if (tocStartPattern.test(lines[i]!)) {
        tocStart = i;
      } else if (tocStart >= 0 && tocEndPattern.test(lines[i]!) && lines[i]!.startsWith('## ') && !lines[i]!.includes('Table of Contents')) {
        tocEnd = i;
        break;
      }
    }

    if (tocStart >= 0 && tocEnd >= 0) {
      const newContent = [
        ...lines.slice(0, tocStart),
        toc,
        ...lines.slice(tocEnd),
      ].join('\n');
      writeFileSync(ENV_DOCS_PATH, newContent, 'utf8');
      console.log('✅ Updated Table of Contents in env.md');
    } else {
      // TOC exists but we can't find the end - append after frontmatter
      const frontmatterEnd = content.indexOf('---\n', content.indexOf('---') + 3);
      if (frontmatterEnd >= 0) {
        const newContent = [
          content.slice(0, frontmatterEnd + 4),
          toc,
          content.slice(frontmatterEnd + 4),
        ].join('\n');
        writeFileSync(ENV_DOCS_PATH, newContent, 'utf8');
        console.log('✅ Added Table of Contents to env.md');
      }
    }
  } else {
    // Insert TOC after frontmatter
    const frontmatterEnd = content.indexOf('---\n', content.indexOf('---') + 3);
    if (frontmatterEnd >= 0) {
      const newContent = [
        content.slice(0, frontmatterEnd + 4),
        toc,
        content.slice(frontmatterEnd + 4),
      ].join('\n');
      writeFileSync(ENV_DOCS_PATH, newContent, 'utf8');
      console.log('✅ Added Table of Contents to env.md');
    } else {
      // No frontmatter, prepend
      const newContent = toc + '\n\n' + content;
      writeFileSync(ENV_DOCS_PATH, newContent, 'utf8');
      console.log('✅ Added Table of Contents to env.md');
    }
  }

  console.log(`📊 Found ${allEnvVars.length} total environment variables in code`);
  console.log(`📝 Found ${documentedVars.size} documented environment variables`);
  console.log(`📋 Generated TOC for ${envVars.length} documented variables:`);
  console.log(`   - Public: ${envVars.filter(v => v.category === 'public').length}`);
  console.log(`   - Server: ${envVars.filter(v => v.category === 'server').length}`);
  console.log(`   - Build: ${envVars.filter(v => v.category === 'build').length}`);
  console.log(`   - Integration: ${envVars.filter(v => v.category === 'integration').length}`);
  console.log(`   - Feature: ${envVars.filter(v => v.category === 'feature').length}`);
  
  if (allEnvVars.length > documentedVars.size) {
    const undocumented = allEnvVars.filter(v => !documentedVars.has(v.name));
    console.log(`\n⚠️  ${undocumented.length} variables are used in code but not documented:`);
    console.log(`   Consider documenting: ${undocumented.slice(0, 5).map(v => v.name).join(', ')}${undocumented.length > 5 ? '...' : ''}`);
  }
}

// Run when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '') ||
                     process.argv[1]?.includes('generate-env-docs-toc');
if (isMainModule) {
  try {
    updateEnvDocsTOC();
  } catch (error) {
    console.error('❌ Failed to generate TOC:', error);
    process.exit(1);
  }
}

export { extractEnvVars, generateTOC, updateEnvDocsTOC };

