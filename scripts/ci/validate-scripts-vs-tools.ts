#!/usr/bin/env tsx
/**
 * scripts/ci/validate-scripts-vs-tools.ts
 * -------------------------------------------------------------
 * Validates that scripts and tools follow the established guidelines:
 *
 * Scripts (/scripts):
 * - SHOULD import from @/ paths when referencing app code (not mandatory)
 * - SHOULD NOT import from external tools
 *
 * Tools (/tools):
 * - SHOULD use relative imports (./, ../)
 * - MUST NOT import from @/ paths (project-specific)
 *
 * Usage: pnpm run tools:lint
 */

import fs from 'fs';
import { globbySync } from 'globby';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'path';

interface ValidationResult {
  file: string;
  violations: string[];
  importCount: number;
  projectImportCount: number;
  externalImportCount: number;
}

interface ValidationSummary {
  totalFiles: number;
  violations: ValidationResult[];
  scriptsWithProjectImports: number;
  toolsWithProjectImports: number;
  scriptsWithExternalImports: number;
  toolsWithProjectImportsViolations: string[];
  basenameCollisions: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const TOOLS_DIR = path.join(ROOT, 'tools');

// Patterns to detect
const PROJECT_IMPORT_PATTERN = /import\s+.*\s+from\s+['"]@\//g;
const EXTERNAL_TOOL_PATTERN = /import\s+.*\s+from\s+['"](?!\.|@\/|@types\/)[^'"]*['"]/g;
const RELATIVE_IMPORT_PATTERN = /import\s+.*\s+from\s+['"]\.\.?\/[^"]*['"]/g;

function analyzeFile(filePath: string): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(ROOT, filePath);

  // Count different types of imports
  const projectImports = content.match(PROJECT_IMPORT_PATTERN) || [];
  const externalImports = content.match(EXTERNAL_TOOL_PATTERN) || [];
  const relativeImports = content.match(RELATIVE_IMPORT_PATTERN) || [];

  const violations: string[] = [];

  // Check if this is a script or tool
  const isScript = filePath.includes('/scripts/');
  const isTool = filePath.includes('/tools/');

  if (isScript) {
    // Scripts SHOULD NOT import from external tools
    if (externalImports.length > 0) {
      violations.push('Scripts should not import from external tools');
    }
  }

  if (isTool) {
    // Tools MUST NOT import from @/ paths
    if (projectImports.length > 0) {
      violations.push('Tools should not import from @/ paths (project-specific)');
    }

    // Tools SHOULD use relative imports
    if (relativeImports.length === 0 && externalImports.length === 0) {
      violations.push('Tools should use relative imports (./, ../) or external packages');
    }
  }

  return {
    file: relativePath,
    violations,
    importCount: projectImports.length + externalImports.length + relativeImports.length,
    projectImportCount: projectImports.length,
    externalImportCount: externalImports.length
  };
}

function validateDirectory(dirPath: string, pattern: string): ValidationResult[] {
  const files = globbySync([pattern], { cwd: dirPath, absolute: true });
  return files.map(analyzeFile);
}

function generateSummary(results: ValidationResult[], toolsWithProjectImportsViolations: string[], basenameCollisions: string[]): ValidationSummary {
  const violations = results.filter(r => r.violations.length > 0);
  const scripts = results.filter(r => r.file.includes('/scripts/'));
  const tools = results.filter(r => r.file.includes('/tools/'));

  return {
    totalFiles: results.length,
    violations,
    scriptsWithProjectImports: scripts.filter(r => r.projectImportCount > 0).length,
    toolsWithProjectImports: tools.filter(r => r.projectImportCount > 0).length,
    scriptsWithExternalImports: scripts.filter(r => r.externalImportCount > 0).length,
    toolsWithProjectImportsViolations,
    basenameCollisions
  };
}

// Additional validation functions for hardened checks
function getAllFiles(dir: string): string[] {
  const out: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const p = path.join(dir, entry);
      try {
        const s = statSync(p);
        if (s.isDirectory()) {
          out.push(...getAllFiles(p));
        } else if (/\.(m|c)?tsx?$|\.(m|c)?js$/.test(entry)) {
          out.push(p.replace(/\\/g, '/'));
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return out;
}

function fileContains(p: string, patterns: RegExp[]): boolean {
  try {
    const src = fs.readFileSync(p, 'utf8');
    return patterns.some((r) => r.test(src));
  } catch {
    return false;
  }
}

function validateNoProjectImportsInTools(): string[] {
  const violations: string[] = [];
  const toolFiles = getAllFiles(TOOLS_DIR);

  for (const file of toolFiles) {
    if (fileContains(file, [/from\s+['"]@/, /require\s*\(\s*['"]@/])) {
      violations.push(path.relative(ROOT, file));
    }
  }

  return violations;
}

function validateNoBasenameCollisions(): string[] {
  const collisions: string[] = [];
  const toolsBase = new Map<string, string[]>();
  const scriptsBase = new Map<string, string[]>();

  // Build basename maps
  for (const f of getAllFiles(TOOLS_DIR)) {
    const b = path.basename(f);
    const arr = toolsBase.get(b) ?? [];
    arr.push(path.relative(ROOT, f));
    toolsBase.set(b, arr);
  }

  for (const f of getAllFiles(SCRIPTS_DIR)) {
    const b = path.basename(f);
    const arr = scriptsBase.get(b) ?? [];
    arr.push(path.relative(ROOT, f));
    scriptsBase.set(b, arr);
  }

  // Find collisions
  for (const [name, toolPaths] of toolsBase) {
    const scriptPaths = scriptsBase.get(name);
    if (scriptPaths && scriptPaths.length) {
      collisions.push(`${name} → tools: [${toolPaths.join(', ')}], scripts: [${scriptPaths.join(', ')}]`);
    }
  }

  return collisions;
}

function printResults(summary: ValidationSummary): void {
  console.log('\n🔍 Scripts vs Tools Validation Results');
  console.log('=====================================\n');

  console.log(`📊 Summary:`);
  console.log(`   Total files analyzed: ${summary.totalFiles}`);
  console.log(`   Scripts with project imports: ${summary.scriptsWithProjectImports} ✅`);
  console.log(`   Tools with project imports: ${summary.toolsWithProjectImports} ❌`);
  console.log(`   Scripts with external imports: ${summary.scriptsWithExternalImports} ❌`);
  console.log(`   Tools with @/ imports: ${summary.toolsWithProjectImportsViolations.length} ❌`);
  console.log(`   Basename collisions: ${summary.basenameCollisions.length} ❌`);
  console.log(`   Total violations: ${summary.violations.length + summary.toolsWithProjectImportsViolations.length + summary.basenameCollisions.length}\n`);

  let hasViolations = false;

  if (summary.violations.length > 0) {
    console.log('❌ Import Violations Found:');
    summary.violations.forEach(violation => {
      console.log(`\n   📁 ${violation.file}`);
      violation.violations.forEach(v => console.log(`      - ${v}`));
    });
    hasViolations = true;
  }

  if (summary.toolsWithProjectImportsViolations.length > 0) {
    console.log('\n❌ Tools with @/ Imports:');
    summary.toolsWithProjectImportsViolations.forEach(file => {
      console.log(`   📁 ${file}`);
    });
    hasViolations = true;
  }

  if (summary.basenameCollisions.length > 0) {
    console.log('\n❌ Basename Collisions:');
    summary.basenameCollisions.forEach(collision => {
      console.log(`   📁 ${collision}`);
    });
    hasViolations = true;
  }

  if (hasViolations) {
    console.log('\n💡 Guidelines:');
    console.log('   Scripts (/scripts): SHOULD import from @/ when referencing app code; avoid external tool imports');
    console.log('   Tools (/tools): MUST NOT import from @/ paths; SHOULD use relative imports');
    console.log('   No basename collisions between scripts/ and tools/ directories');

    process.exitCode = 1;
  } else {
    console.log('✅ All files follow the scripts vs tools guidelines!');
  }
}

function main(): void {
  console.log('🔍 Validating scripts vs tools organization...\n');

  // Analyze scripts directory
  const scriptResults = validateDirectory(SCRIPTS_DIR, '**/*.{ts,js}');

  // Analyze tools directory
  const toolResults = validateDirectory(TOOLS_DIR, '**/*.{ts,js}');

  // Run hardened checks
  const toolsWithProjectImportsViolations = validateNoProjectImportsInTools();
  const basenameCollisions = validateNoBasenameCollisions();

  // Combine results
  const allResults = [...scriptResults, ...toolResults];

  // Generate and print summary
  const summary = generateSummary(allResults, toolsWithProjectImportsViolations, basenameCollisions);
  printResults(summary);
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}

