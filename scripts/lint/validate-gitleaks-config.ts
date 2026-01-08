#!/usr/bin/env tsx
/**
 * Validates gitleaks configuration file syntax and patterns.
 * 
 * Checks that config/.gitleaks.toml uses valid Go regex patterns (not glob patterns)
 * and validates the structure of the configuration file to prevent runtime errors.
 * 
 * Intent: Ensure gitleaks configuration is valid
 * Files: config/.gitleaks.toml
 * Invocation: pnpm tools:gitleaks:validate
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

interface ValidationError {
  line: number;
  path: string;
  issue: string;
  suggestion?: string;
}

/**
 * Validates that a string is a valid Go regex pattern (not a glob pattern)
 */
function isValidGoRegex(pattern: string): { valid: boolean; error?: string } {
  // Check for common glob patterns that are invalid regex
  if (pattern.includes('**')) {
    return {
      valid: false,
      error: 'Contains glob pattern "**" - use ".*" for "match any" in regex',
    };
  }

  if (pattern.includes('*') && !pattern.match(/[^\\]\*/) && !pattern.startsWith('*')) {
    // Single * without preceding character (except escaped) is suspicious
    if (!pattern.match(/\\\*/)) {
      return {
        valid: false,
        error: 'Contains unescaped "*" - may be glob pattern instead of regex',
      };
    }
  }

  // Try to compile as Go regex (basic validation)
  // Go regex is similar to RE2, which is a subset of PCRE
  try {
    // Use Node.js RegExp as approximation (Go regex is RE2-based)
    // This catches most syntax errors
    new RegExp(pattern);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid regex syntax: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Extracts paths from allowlist section in TOML file
 */
function extractAllowlistPaths(content: string): Array<{ path: string; line: number }> {
  const lines = content.split('\n');
  const paths: Array<{ path: string; line: number }> = [];
  let inAllowlist = false;
  let inPathsArray = false;
  let bracketDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Detect [allowlist] section
    if (trimmed === '[allowlist]') {
      inAllowlist = true;
      continue;
    }

    // Reset if we hit another top-level section
    if (trimmed.startsWith('[') && !trimmed.startsWith('[[')) {
      if (trimmed !== '[allowlist]') {
        inAllowlist = false;
        inPathsArray = false;
      }
      continue;
    }

    if (!inAllowlist) continue;

    // Detect paths = [ array start
    if (trimmed.startsWith('paths') && trimmed.includes('=')) {
      inPathsArray = true;
      bracketDepth = 0;
      // Check if array starts on same line
      if (trimmed.includes('[')) {
        bracketDepth = (trimmed.match(/\[/g) || []).length - (trimmed.match(/\]/g) || []).length;
      }
      continue;
    }

    if (!inPathsArray) continue;

    // Track bracket depth
    bracketDepth += (line.match(/\[/g) || []).length;
    bracketDepth -= (line.match(/\]/g) || []).length;

    // Extract string values (handles both single and triple quotes)
    const stringPattern = /'''([^']+)'''|'([^']+)'|"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = stringPattern.exec(line)) !== null) {
      const pathValue = match[1] || match[2] || match[3];
      if (pathValue) {
        paths.push({ path: pathValue, line: i + 1 });
      }
    }

    // Check if array closed
    if (bracketDepth <= 0 && trimmed.includes(']')) {
      inPathsArray = false;
    }
  }

  return paths;
}

function main() {
  const configPath = resolve(__dirname, '..', '..', 'config', '.gitleaks.toml');

  logger.info(`🔍 Validating gitleaks config: ${configPath}`);

  let content: string;
  try {
    content = readFileSync(configPath, 'utf-8');
  } catch (error) {
    logger.error(`❌ Failed to read config file: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  const paths = extractAllowlistPaths(content);
  const errors: ValidationError[] = [];

  logger.info(`Found ${paths.length} path patterns in allowlist`);

  for (const { path: pattern, line } of paths) {
    const validation = isValidGoRegex(pattern);
    if (!validation.valid) {
      const suggestion = getSuggestion(pattern);
      errors.push({
        line,
        path: pattern,
        issue: validation.error || 'Invalid pattern',
        ...(suggestion && { suggestion }),
      });
    }
  }

  if (errors.length > 0) {
    logger.error(`\n❌ Found ${errors.length} invalid pattern(s) in gitleaks config:\n`);
    errors.forEach(({ line, path, issue, suggestion }) => {
      logger.error(`  Line ${line}: "${path}"`);
      logger.error(`    Issue: ${issue}`);
      if (suggestion) {
        logger.info(`    Suggestion: ${suggestion}`);
      }
      logger.error('');
    });

    logger.error('💡 Remember: gitleaks v8 requires Go regex patterns, NOT glob patterns.');
    logger.error('   Common conversions:');
    logger.error('     - **/*.md → .*\\.md$');
    logger.error('     - **/*.test.ts → .*\\.test\\.ts$');
    logger.error('     - docs/ → ^docs/');
    logger.error('     - .env.example → ^\\.env\\.example$');

    process.exitCode = 1;
  } else {
    logger.success('✅ All path patterns are valid Go regex patterns');
  }
}

function getSuggestion(pattern: string): string | undefined {
  // Provide helpful suggestions for common glob patterns
  if (pattern.includes('**/*.md')) {
    return 'Use: .*\\.md$';
  }
  if (pattern.includes('**/*.test.ts')) {
    return 'Use: .*\\.test\\.ts$';
  }
  if (pattern.includes('**/*.test.tsx')) {
    return 'Use: .*\\.test\\.tsx$';
  }
  if (pattern.includes('**/*.stories.tsx')) {
    return 'Use: .*\\.stories\\.tsx$';
  }
  if (pattern === 'docs/') {
    return 'Use: ^docs/';
  }
  if (pattern === '.env.example') {
    return 'Use: ^\\.env\\.example$';
  }
  if (pattern.includes('**')) {
    return 'Replace ** with .* for regex "match any"';
  }
  return undefined;
}

main();
