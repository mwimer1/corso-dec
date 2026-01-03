#!/usr/bin/env tsx
/**
 * @fileoverview Validates that commit scope documentation matches commitlint.config.cjs
 * 
 * This script ensures consistency between:
 * - commitlint.config.cjs (authoritative source)
 * - .gitmessage (git commit template)
 * - .cursor/rules/ai-agent-development-environment.mdc (cursor rules)
 * - docs/development/commit-conventions.md (documentation)
 * 
 * Run this script in CI and pre-commit hooks to prevent scope documentation drift.
 */

import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { parse } from 'path';

interface ScopeValidationResult {
  file: string;
  isValid: boolean;
  missingScopes: string[];
  invalidScopes: string[];
  errors: string[];
}

/**
 * Extract allowed scopes from commitlint.config.cjs
 */
function getCommitlintScopes(): string[] {
  const configPath = resolve(process.cwd(), 'commitlint.config.cjs');
  const content = readFileSync(configPath, 'utf-8');
  
  // Find the scope-enum rule section
  const scopeEnumStart = content.indexOf("'scope-enum'");
  if (scopeEnumStart === -1) {
    throw new Error('Could not find scope-enum in commitlint.config.cjs');
  }
  
  // Find the array that follows scope-enum
  const arrayStart = content.indexOf('[', scopeEnumStart);
  if (arrayStart === -1) {
    throw new Error('Could not find scope-enum array in commitlint.config.cjs');
  }
  
  // Find the matching closing bracket
  let depth = 0;
  let arrayEnd = arrayStart;
  for (let i = arrayStart; i < content.length; i++) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  
  const arrayContent = content.substring(arrayStart + 1, arrayEnd);
  
  // Extract quoted scope names from the array content
  const scopes: string[] = [];
  const scopeRegex = /['"`]([a-z-]+)['"`]/g;
  // Exclude commitlint keywords and non-scope values
  const excluded = new Set(['always', 'never', 'scope-enum', 'type-enum']);
  let match;
  while ((match = scopeRegex.exec(arrayContent)) !== null) {
    const scope = match[1];
    // Only add valid scope names (lowercase with hyphens) and exclude keywords
    if (scope && /^[a-z-]+$/.test(scope) && !excluded.has(scope)) {
      scopes.push(scope);
    }
  }
  
  if (scopes.length === 0) {
    throw new Error('No scopes found in commitlint.config.cjs scope-enum');
  }
  
  return scopes.sort();
}

/**
 * Extract scopes mentioned in explicit scope lists only
 * Ignores examples, code snippets, and general text
 */
function extractScopesFromFile(filePath: string, content: string): string[] {
  const scopes: Set<string> = new Set();
  
  // Pattern 1: Explicit scope lists in comments/documentation
  // Matches: "# Scope should be one of: auth, dashboard, chat"
  // Matches: "**Scopes**: auth, dashboard, chat"
  // Only matches if it's clearly a scope list (contains "scope" and comma-separated list)
  const explicitListPattern = /(?:scope|scopes|Scope|Scopes).*?(?:should be|are|is|:).*?([a-z-]+(?:\s*,\s*[a-z-]+){2,})/gi;
  let match;
  while ((match = explicitListPattern.exec(content)) !== null) {
    const scopeList = match[1];
    if (!scopeList) continue;
    scopeList.split(',').forEach(scope => {
      const trimmed = scope.trim();
      // Only add if it's a valid scope name (2+ chars, lowercase, hyphens only)
      if (trimmed && /^[a-z-]{2,}$/.test(trimmed)) {
        scopes.add(trimmed);
      }
    });
  }
  
  // Pattern 2: Backtick lists in scope sections (more restrictive)
  // Only matches if preceded by "scope" or "scopes" within 50 chars
  // Exclude commitlint keywords and documentation terms
  const excludedTerms = new Set(['scope-enum', 'type-enum', 'always', 'never', 'description', 'what', 'one', 'strictly', 'ted', 'defined', 'add', 'feature', 'main']);
  const scopeBacktickPattern = /(?:scope|scopes|Scope|Scopes).{0,50}?`([a-z-]{2,})`/gi;
  while ((match = scopeBacktickPattern.exec(content)) !== null) {
    const scope = match[1];
    if (scope && /^[a-z-]{2,}$/.test(scope) && !excludedTerms.has(scope)) {
      scopes.add(scope);
    }
  }
  
  return Array.from(scopes).sort();
}

/**
 * Validate a file's scope documentation
 */
function validateFile(
  filePath: string,
  allowedScopes: string[],
  allowedScopesSet: Set<string>
): ScopeValidationResult {
  const content = readFileSync(filePath, 'utf-8');
  const mentionedScopes = extractScopesFromFile(filePath, content);
  
  const invalidScopes: string[] = [];
  const missingScopes: string[] = [];
  const errors: string[] = [];
  
  // Check for invalid scopes (mentioned but not in allowed list)
  for (const scope of mentionedScopes) {
    if (!allowedScopesSet.has(scope)) {
      invalidScopes.push(scope);
      errors.push(`Invalid scope "${scope}" found in ${filePath}`);
    }
  }
  
  // For .gitmessage and cursor rules, check if they're missing many scopes
  // (we don't require complete lists in docs, but we check for major omissions)
  if (filePath.includes('.gitmessage') || filePath.includes('cursor/rules')) {
    const mentionedSet = new Set(mentionedScopes);
    const criticalScopes = ['auth', 'dashboard', 'api', 'components', 'docs'];
    for (const scope of criticalScopes) {
      if (!mentionedSet.has(scope) && !content.includes(scope)) {
        // Only warn if the file is supposed to list scopes
        if (content.includes('scope') || content.includes('Scope')) {
          missingScopes.push(scope);
        }
      }
    }
  }
  
  const isValid = invalidScopes.length === 0 && errors.length === 0;
  
  return {
    file: filePath,
    isValid,
    missingScopes,
    invalidScopes,
    errors,
  };
}

/**
 * Main validation function
 */
function main(): void {
  const allowedScopes = getCommitlintScopes();
  const allowedScopesSet = new Set(allowedScopes);
  
  console.log('🔍 Validating commit scope documentation...\n');
  console.log(`📋 Allowed scopes (${allowedScopes.length}): ${allowedScopes.join(', ')}\n`);
  
  const filesToCheck = [
    resolve(process.cwd(), '.gitmessage'),
    resolve(process.cwd(), '.cursor/rules/ai-agent-development-environment.mdc'),
    resolve(process.cwd(), 'docs/development/commit-conventions.md'),
  ];
  
  const results: ScopeValidationResult[] = [];
  
  for (const filePath of filesToCheck) {
    try {
      const result = validateFile(filePath, allowedScopes, allowedScopesSet);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error validating ${filePath}:`, error);
      process.exit(1);
    }
  }
  
  // Print results
  let hasErrors = false;
  
  for (const result of results) {
    const relativePath = result.file.replace(process.cwd() + '/', '');
    
    if (result.isValid) {
      console.log(`✅ ${relativePath}`);
    } else {
      console.log(`❌ ${relativePath}`);
      hasErrors = true;
      
      if (result.invalidScopes.length > 0) {
        console.log(`   Invalid scopes: ${result.invalidScopes.join(', ')}`);
      }
      
      if (result.missingScopes.length > 0) {
        console.log(`   Missing critical scopes: ${result.missingScopes.join(', ')}`);
      }
      
      for (const error of result.errors) {
        console.log(`   ${error}`);
      }
    }
  }
  
  console.log('');
  
  if (hasErrors) {
    console.error('❌ Commit scope validation failed!');
    console.error('   Please update the files listed above to match commitlint.config.cjs');
    console.error('   See docs/development/commit-conventions.md for the complete scope list.');
    process.exit(1);
  } else {
    console.log('✅ All commit scope documentation is consistent!');
    process.exit(0);
  }
}

// ES module entry point check
const isMainModule = import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '') || 
                     process.argv[1]?.includes('validate-commit-scopes.ts');
if (isMainModule) {
  main();
}

export { getCommitlintScopes, validateFile };
