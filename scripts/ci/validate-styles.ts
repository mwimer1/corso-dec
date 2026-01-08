#!/usr/bin/env tsx
// scripts/ci/validate-styles.ts
// Validates that components and CSS files follow styling standards:
// - No inline style attributes in React components (except for dynamic values)
// - No hardcoded CSS values (colors, spacing) that should use design tokens

import { globby } from 'globby';
import fs from 'node:fs';
import path from 'node:path';

interface Violation {
  file: string;
  line: number;
  message: string;
  code: string;
}

const violations: Violation[] = [];

// Patterns to detect violations
const HEX_COLOR_PATTERN = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
const RGB_COLOR_PATTERN = /rgba?\([^)]+\)/gi;
const PIXEL_VALUE_PATTERN = /\b(\d+)px\b/g;
const REM_VALUE_PATTERN = /\b(\d+\.?\d*)rem\b/g;

// Allowed inline style patterns (dynamic values that can't use tokens)
const ALLOWED_INLINE_PATTERNS = [
  /width:\s*['"`]?\d+%['"`]?/, // Percentage widths (e.g., progress bars)
  /height:\s*['"`]?\d+%['"`]?/, // Percentage heights
  /transform:/, // Transform values (often dynamic)
  /opacity:\s*['"`]?\d+\.?\d*['"`]?/, // Opacity (often dynamic)
  /z-index:/, // Z-index (often dynamic)
  /display:\s*['"`]?(none|block|flex|grid)['"`]?/, // Display toggles
];

// Files to check
const COMPONENT_PATTERNS = [
  'components/**/*.{tsx,jsx}',
  'app/**/*.{tsx,jsx}',
];

const CSS_PATTERNS = [
  'styles/**/*.css',
  'components/**/*.module.css',
  'app/**/*.module.css',
];

// Files to ignore
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/__tests__/**',
  '**/__snapshots__/**',
];

/**
 * Check if an inline style is allowed (dynamic value)
 */
function isAllowedInlineStyle(styleContent: string): boolean {
  return ALLOWED_INLINE_PATTERNS.some(pattern => pattern.test(styleContent));
}

/**
 * Check for inline style attributes in React components
 */
function checkInlineStyles(content: string, filePath: string): void {
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const lineNum = i + 1;
    
    // Match style={{...}} or style="..." patterns
    const styleMatch = line.match(/style\s*=\s*\{[\s\S]*?\}|\s*style\s*=\s*["'][^"']*["']/);
    
    if (styleMatch) {
      const styleContent = styleMatch[0];
      
      // Skip if it's an allowed pattern (dynamic value)
      if (isAllowedInlineStyle(styleContent)) {
        continue;
      }
      
      // Check for hardcoded colors
      if (HEX_COLOR_PATTERN.test(styleContent) || RGB_COLOR_PATTERN.test(styleContent)) {
        violations.push({
          file: filePath,
          line: lineNum,
          message: 'Inline style contains hardcoded color. Use CSS classes with design tokens instead.',
          code: line.trim(),
        });
      }
      
      // Check for hardcoded pixel values (spacing)
      const pixelMatches = styleContent.match(PIXEL_VALUE_PATTERN);
      if (pixelMatches) {
        // Allow 0px, 1px for borders, but flag larger values
        const problematicPixels = pixelMatches.filter(m => {
          const value = parseInt(m);
          return value > 1 && value !== 0;
        });
        
        if (problematicPixels.length > 0) {
          violations.push({
            file: filePath,
            line: lineNum,
            message: 'Inline style contains hardcoded pixel values. Use CSS classes with spacing tokens instead.',
            code: line.trim(),
          });
        }
      }
    }
  }
}

/**
 * Check CSS files for hardcoded values that should use tokens
 */
function checkCSSFile(content: string, filePath: string): void {
  const lines = content.split('\n');
  
  // Skip token definition files
  if (filePath.includes('styles/tokens/')) {
    return;
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const lineNum = i + 1;
    
    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('//')) {
      continue;
    }
    
    // Skip lines that already use CSS variables
    if (line.includes('var(--')) {
      continue;
    }
    
    // Check for hardcoded hex colors (but allow in comments)
    const hexMatches = line.match(HEX_COLOR_PATTERN);
    if (hexMatches) {
      // Check if it's in a comment
      const commentIndex = line.indexOf('/*');
      const hexIndex = line.indexOf(hexMatches[0]);
      
      if (commentIndex === -1 || hexIndex < commentIndex) {
        violations.push({
          file: filePath,
          line: lineNum,
          message: 'Hardcoded hex color detected. Use CSS variables from styles/tokens instead (e.g., hsl(var(--foreground))).',
          code: line.trim(),
        });
      }
    }
    
    // Check for hardcoded RGB colors
    if (RGB_COLOR_PATTERN.test(line) && !line.includes('var(--')) {
      violations.push({
        file: filePath,
        line: lineNum,
        message: 'Hardcoded RGB/RGBA color detected. Use CSS variables from styles/tokens instead.',
        code: line.trim(),
      });
    }
    
    // Check for hardcoded pixel spacing values (but allow 0px, 1px for borders)
    const pixelMatches = line.match(PIXEL_VALUE_PATTERN);
    if (pixelMatches) {
      const problematicPixels = pixelMatches.filter(m => {
        const value = parseInt(m);
        // Allow 0px, 1px (common for borders), but flag spacing values
        return value > 1;
      });
      
      if (problematicPixels.length > 0 && !line.includes('var(--space-')) {
        violations.push({
          file: filePath,
          line: lineNum,
          message: 'Hardcoded pixel spacing detected. Use spacing tokens (var(--space-*)) instead.',
          code: line.trim(),
        });
      }
    }
    
    // Check for hardcoded rem values that might be spacing (but allow typography rem values in some cases)
    // This is more lenient since rem is often used for typography
    const remMatches = line.match(REM_VALUE_PATTERN);
    if (remMatches && !line.includes('font-size') && !line.includes('line-height') && !line.includes('var(--')) {
      // Flag rem values that look like spacing (common spacing values)
      const spacingRemValues = ['0.5rem', '1rem', '1.5rem', '2rem', '2.5rem', '3rem', '4rem'];
      const hasSpacingRem = remMatches.some(m => spacingRemValues.includes(m));
      
      if (hasSpacingRem) {
        violations.push({
          file: filePath,
          line: lineNum,
          message: 'Hardcoded rem spacing detected. Use spacing tokens (var(--space-*)) instead.',
          code: line.trim(),
        });
      }
    }
  }
}

/**
 * Main validation function
 */
async function validateStyles(): Promise<void> {
  console.log('🔍 Validating styles...\n');
  
  // Check React components
  const componentFiles = await globby(COMPONENT_PATTERNS, {
    ignore: IGNORE_PATTERNS,
    absolute: false,
  });
  
  console.log(`Checking ${componentFiles.length} component files...`);
  
  for (const file of componentFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      checkInlineStyles(content, file);
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }
  
  // Check CSS files
  const cssFiles = await globby(CSS_PATTERNS, {
    ignore: IGNORE_PATTERNS,
    absolute: false,
  });
  
  console.log(`Checking ${cssFiles.length} CSS files...`);
  
  for (const file of cssFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      checkCSSFile(content, file);
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }
  
  // Report violations
  if (violations.length > 0) {
    console.error('\n❌ Style validation failed:\n');
    
    // Group by file
    const byFile = new Map<string, Violation[]>();
    for (const violation of violations) {
      if (!byFile.has(violation.file)) {
        byFile.set(violation.file, []);
      }
      byFile.get(violation.file)!.push(violation);
    }
    
    for (const [file, fileViolations] of byFile.entries()) {
      console.error(`\n${file}:`);
      for (const violation of fileViolations) {
        console.error(`  Line ${violation.line}: ${violation.message}`);
        console.error(`    ${violation.code}`);
      }
    }
    
    console.error(`\n\nTotal violations: ${violations.length}`);
    console.error('\n💡 Tips:');
    console.error('  - Use CSS classes with Tailwind utilities instead of inline styles');
    console.error('  - Use CSS variables from styles/tokens for colors and spacing');
    console.error('  - For dynamic values (like progress bars), inline styles are acceptable');
    console.error('  - See .cursor/rules/styling-standards.mdc for guidelines\n');
    
    process.exitCode = 1;
  } else {
    console.log('\n✅ Style validation passed. No violations found.');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void validateStyles();
}
