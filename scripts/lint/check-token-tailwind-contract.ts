#!/usr/bin/env tsx
/**
 * Token↔Tailwind Contract Enforcement
 * 
 * Validates that:
 * 1. All tokens referenced in tailwind.config.ts are defined in styles/tokens/*.css
 * 2. Fallback values in tailwind.config.ts match token defaults exactly
 * 
 * This prevents "two sources of truth" configuration drift.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const TOKENS_DIR = join(REPO_ROOT, 'styles', 'tokens');
const TAILWIND_CONFIG = join(REPO_ROOT, 'tailwind.config.ts');

/**
 * Tokens that are runtime-set by libraries (not defined in CSS)
 * These are allowed to be referenced without definition
 */
const RUNTIME_TOKENS = new Set([
  'radix-accordion-content-height', // Set by Radix UI Accordion component
]);

interface TokenDefinition {
  name: string;
  defaultValue: string;
  normalized: string;
}

/**
 * Normalize CSS value for comparison (remove whitespace, normalize quotes)
 */
function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, '"')
    .replace(/;\s*$/, '');
}

/**
 * Extract token definitions from CSS files
 */
function extractTokensFromCSS(): Map<string, TokenDefinition> {
  const tokens = new Map<string, TokenDefinition>();
  
  // Read all CSS files in tokens directory (excluding index.css)
  const files = readdirSync(TOKENS_DIR).filter(
    (f) => f.endsWith('.css') && f !== 'index.css'
  );
  
  for (const file of files) {
    const content = readFileSync(join(TOKENS_DIR, file), 'utf-8');
    
    // Match :root { ... } blocks and extract --token-name: value;
    const rootBlockRegex = /:root\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = rootBlockRegex.exec(content)) !== null) {
      const blockContent = match[1];
      if (!blockContent) continue;
      
      // Match --token-name: value; patterns
      const tokenRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
      let tokenMatch: RegExpExecArray | null;
      
      while ((tokenMatch = tokenRegex.exec(blockContent) as RegExpExecArray | null) !== null) {
        const name = tokenMatch[1];
        const rawValueMatch = tokenMatch[2];
        
        if (name === undefined || rawValueMatch === undefined) continue;
        
        const rawValue = rawValueMatch.trim();
        if (!rawValue || !name) continue;
        
        // Skip if already defined (first definition wins)
        // TypeScript: name and rawValue are guaranteed non-null after checks above
        if (!tokens.has(name)) {
          tokens.set(name, {
            name: name!,
            defaultValue: rawValue,
            normalized: normalizeValue(rawValue as string),
          });
        }
      }
    }
  }
  
  return tokens;
}

/**
 * Remove comments from code to avoid matching tokens in comments
 */
function stripComments(content: string): string {
  // Remove single-line comments
  content = content.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  return content;
}

/**
 * Check if a token value is a var() reference (not a literal)
 */
function isVarReference(value: string): boolean {
  return value.trim().startsWith('var(');
}

/**
 * Extract token references and fallbacks from Tailwind config
 */
function extractTailwindTokenUsage(): Array<{
  token: string;
  fallback: string | null;
  context: string;
}> {
  const content = readFileSync(TAILWIND_CONFIG, 'utf-8');
  const strippedContent = stripComments(content);
  const usages: Array<{ token: string; fallback: string | null; context: string }> = [];
  
  // Match var(--token-name, fallback) or var(--token-name)
  // Handle nested parentheses by matching balanced pairs
  const varRegex = /var\(--([a-z0-9-]+)(?:\s*,\s*((?:[^()]|\([^()]*(?:\([^()]*(?:\([^()]*\)[^()]*)*\)[^()]*)*\))*))?\)/gi;
  let match;
  
  while ((match = varRegex.exec(strippedContent)) !== null) {
    const token = match[1];
    if (!token) continue;
    
    const fallback = match[2]?.trim() || null;
    
    // Get context (line number and surrounding code from original content)
    const beforeMatch = content.substring(0, match.index);
    const lineNumber = beforeMatch.split('\n').length;
    const lines = content.split('\n');
    const contextLine = lines[lineNumber - 1]?.trim() || '';
    
    usages.push({
      token,
      fallback,
      context: `line ${lineNumber}: ${contextLine.substring(0, 80)}`,
    });
  }
  
  return usages;
}

/**
 * Main validation logic
 */
function validateContract(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Extract token definitions
  const definedTokens = extractTokensFromCSS();
  
  // Extract Tailwind usage
  const tailwindUsages = extractTailwindTokenUsage();
  
  // Check each Tailwind usage
  for (const usage of tailwindUsages) {
    // Skip runtime tokens (set by libraries)
    if (RUNTIME_TOKENS.has(usage.token)) {
      continue;
    }
    
    const tokenDef = definedTokens.get(usage.token);
    
    // ERROR: Token not defined
    if (!tokenDef) {
      errors.push(
        `Token '--${usage.token}' is referenced in tailwind.config.ts but not defined in styles/tokens/*.css\n` +
        `  Context: ${usage.context}`
      );
      continue;
    }
    
    // Skip fallback comparison if token default is a var() reference
    // (e.g., --delay-75: var(--duration-75) - these are aliases, not literals)
    if (isVarReference(tokenDef.defaultValue)) {
      // For var() references, we can't compare fallbacks directly
      // Just ensure the token exists
      continue;
    }
    
    // ERROR: Fallback mismatch (if fallback exists)
    if (usage.fallback) {
      const normalizedFallback = normalizeValue(usage.fallback);
      
      if (normalizedFallback !== tokenDef.normalized) {
        errors.push(
          `Token '--${usage.token}' fallback mismatch:\n` +
          `  Tailwind fallback: ${usage.fallback}\n` +
          `  Token default:    ${tokenDef.defaultValue}\n` +
          `  Context: ${usage.context}`
        );
      }
    } else {
      // WARNING: No fallback (not an error, but good practice)
      warnings.push(
        `Token '--${usage.token}' has no fallback in tailwind.config.ts\n` +
        `  Context: ${usage.context}`
      );
    }
  }
  
  return { errors, warnings };
}

/**
 * Main execution
 */
function main() {
  try {
    const { errors, warnings } = validateContract();
    
    // Print warnings first
    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      warnings.forEach((w) => console.warn(w));
      console.warn('');
    }
    
    // Print errors
    if (errors.length > 0) {
      console.error('❌ Token↔Tailwind Contract Violations:\n');
      errors.forEach((e) => console.error(e));
      console.error('\n💡 Fix: Ensure all tokens are defined in styles/tokens/*.css');
      console.error('   and fallback values match token defaults exactly.\n');
      process.exitCode = 1;
    } else {
      // Success
      console.log('✅ Token↔Tailwind contract validated successfully');
      if (warnings.length > 0) {
        console.log(`   (${warnings.length} warning(s) - consider adding fallbacks)`);
      }
    }
  } catch (error) {
    console.error('❌ Error validating token contract:', error);
    process.exitCode = 1;
  }
}

main();

