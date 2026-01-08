/**
 * Utility functions for documentation content validation
 * 
 * These functions are extracted from validate-docs-content.ts to allow
 * unit testing without exposing them as part of the script's public API.
 */

export interface ValidationIssue {
  file: string;
  line?: number;
  issue: string;
  severity: 'error' | 'warning';
}

export interface CodeBlock {
  language?: string;
  content: string;
  startLine: number;
}

/**
 * Extract code blocks from markdown content
 */
export function extractCodeBlocks(content: string, filePath: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentBlock: { language?: string | undefined; content: string[]; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const codeBlockStart = /^```(\w+)?/.exec(line);
    
    if (codeBlockStart && !inCodeBlock) {
      inCodeBlock = true;
      currentBlock = {
        ...(codeBlockStart[1] ? { language: codeBlockStart[1] } : {}),
        content: [],
        startLine: i + 1,
      };
    } else if (line.trim() === '```' && inCodeBlock && currentBlock) {
      inCodeBlock = false;
      blocks.push({
        ...(currentBlock.language ? { language: currentBlock.language } : {}),
        content: currentBlock.content.join('\n'),
        startLine: currentBlock.startLine,
      });
      currentBlock = null;
    } else if (inCodeBlock && currentBlock) {
      currentBlock.content.push(line);
    }
  }

  return blocks;
}

/**
 * Check for banned patterns in documentation
 */
export function checkBannedPatterns(content: string, filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lines = content.split('\n');
  
  // Whitelist of specific file:line combinations that are known legitimate exceptions
  // These are legitimate examples in documentation that should not trigger warnings
  // Format: "filepath:lineNumber" - we'll check both forward and backward slash formats
  const whitelistEntries = [
    'docs/references/env.md:756',
    'docs/references/env.md:768',
    'docs/references/env.md:781',
    'docs/upgrades/nextjs-16-upgrade-guide.md:245',
    'docs/testing-quality/testing-guide.md:508',
    'docs/testing-quality/testing-guide.md:525',
    'docs/development/coding-standards.md:395',
    // Also add Windows path format (backslashes) for safety
    'docs\\references\\env.md:756',
    'docs\\references\\env.md:768',
    'docs\\references\\env.md:781',
    'docs\\upgrades\\nextjs-16-upgrade-guide.md:245',
    'docs\\testing-quality\\testing-guide.md:508',
    'docs\\testing-quality\\testing-guide.md:525',
    'docs\\development\\coding-standards.md:395',
  ];
  
  // Normalize file path for whitelist matching (use forward slashes)
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  const whitelist = new Set(whitelistEntries);
  
  // Track code blocks and whether they're code references (showing actual codebase code)
  const codeBlockRanges: Array<{ start: number; end: number; isCodeReference: boolean }> = [];
  let inCodeBlock = false;
  let codeBlockStart = -1;
  let isCodeReference = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Match code block start: ```language or ```startLine:endLine:filepath (code reference)
    // Code reference format: ```16:25:lib/vendors/ag-grid.client.ts (no language tag, starts with numbers)
    const isCodeRefStart = /^```\d+:\d+:[^\s]+$/.test(line.trim());
    const isRegularCodeBlock = /^```[\w:./-]*$/.test(line.trim());
    
    if ((isCodeRefStart || isRegularCodeBlock) && !inCodeBlock) {
      inCodeBlock = true;
      codeBlockStart = i;
      // Check if it's a code reference format: ```startLine:endLine:filepath
      isCodeReference = isCodeRefStart;
    } else if (line.trim() === '```' && inCodeBlock) {
      codeBlockRanges.push({ start: codeBlockStart, end: i, isCodeReference });
      inCodeBlock = false;
      isCodeReference = false;
    }
  }
  
  // Also check for evidence examples in audit docs (lines mentioning file paths with line numbers)
  const hasEvidenceExamples = lines.some((line, idx) => {
    if (!filePath.includes('audits/')) return false;
    // Pattern: "lib/path/file.ts: line ~123:" or "lib/path/file.ts: line ~123:"
    return /lib\/[^\s]+:\s*line\s*~?\d+/.test(line) || 
           (line.includes('Evidence examples') && idx < 10);
  });
  
  // Helper to check if a line is in a code reference block
  const isInCodeReference = (lineNum: number): boolean => {
    return codeBlockRanges.some(range => 
      lineNum >= range.start && lineNum <= range.end && range.isCodeReference
    );
  };

  // Helper to check if we're in a specific section (looks back further for section headers)
  const isInSection = (lineNum: number, sectionPatterns: string[]): boolean => {
    // Look back up to 50 lines for section headers (increased from 10 to catch section headers)
    const startLine = Math.max(0, lineNum - 50);
    const sectionContext = lines.slice(startLine, lineNum).join('\n');
    return sectionPatterns.some(pattern => sectionContext.includes(pattern));
  };

  // Banned patterns with their error messages
  const bannedPatterns = [
    {
      pattern: /process\.env\[/g,
      message: 'Direct process.env usage in documentation. Use getEnv() or publicEnv patterns instead.',
      severity: 'error' as const,
      // Allow in code examples that show the wrong way
      allowInComments: true,
    },
    {
      pattern: /process\.env\.([A-Z_][A-Z0-9_]*)/g,
      message: 'Direct process.env property access in documentation. Use getEnv() or publicEnv patterns instead.',
      severity: 'error' as const,
      allowInComments: true,
    },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;
    
    // Note: Whitelist check is now done right before creating issues (see below)
    // This ensures the file path format matches exactly

    // Compute context once per line (not per pattern)
    const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
    const nextLines = lines.slice(i + 1, Math.min(lines.length, i + 5)).join('\n');
    const context = prevLines + '\n' + line + '\n' + nextLines;
    
    // Check for evidence examples: "lib/path/file.ts: line ~123:" or "- lib/path/file.ts: line ~44:"
    // Also check for lines that are part of evidence sections (e.g., "Evidence examples (from scan)")
    // This check applies to all files, but is especially important for audit docs
    // The pattern matches: "lib/path/file.ts: line ~44:" or "lib/path/file.ts: line 44:"
    // It may be indented and may have backticks around the code
    const isEvidenceLine = /lib\/[^\s]+:\s*line\s*~?\d+/.test(line) && line.includes('process.env');
    const isInEvidenceSection = filePath.includes('audits/') && 
                                (prevLines.includes('Evidence examples') || 
                                 prevLines.includes('Evidence examples (from scan)') ||
                                 prevLines.includes('from scan') ||
                                 context.includes('Evidence examples'));
    
    // Skip if it's in audit documents showing evidence (legitimate for audit docs)
    // Audit docs often show actual code from the codebase for review purposes
    // Early exit for evidence lines in audit docs (before pattern test)
    // Also skip if the line is a list item (- or *) that contains process.env and is in an evidence section
    // Normalize path separators for Windows compatibility
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.includes('audits/')) {
      // Check if the line matches the evidence pattern (lib/path: line ~N:)
      // This is the most reliable check - if it matches this pattern, it's definitely evidence
      const matchesEvidencePattern = /lib\/[^\s]+:\s*line\s*~?\d+:/.test(line);
      
      // Check if it's a list item in an evidence section (most common case)
      // The line may contain process.env inside backticks (code examples)
      const isListItemInEvidence = (line.trim().startsWith('-') || line.trim().startsWith('*')) && 
                                    line.includes('process.env') && 
                                    (prevLines.includes('Evidence examples') || 
                                     prevLines.includes('Evidence examples (from scan)') ||
                                     prevLines.includes('from scan'));
      
      // If any of these conditions are true, skip this line
      // Note: matchesEvidencePattern is checked first as it's the most reliable
      if (matchesEvidencePattern || isEvidenceLine || isInEvidenceSection || isListItemInEvidence) {
        continue; // Skip to next line, don't check patterns
      }
    }

    // Pre-check: Determine if this line is in an allowed section BEFORE pattern checking
    // This avoids false positives for legitimate examples
    
    // Enhanced "Don't Do This" detection - check both immediate context and section headers
    const extendedContextForDontDo = lines.slice(Math.max(0, i - 50), i + 5).join('\n');
    const isMarkedIncorrect = line.includes('❌') || prevLines.includes('❌ INCORRECT') || 
                              prevLines.includes('❌ OLD') || prevLines.includes('// ❌') ||
                              line.includes('INCORRECT') || prevLines.includes('INCORRECT');
    const isInDontDoSection = extendedContextForDontDo.includes('## 🚫 Common Anti-Patterns') ||
                               extendedContextForDontDo.includes('### ❌ Don\'t Do This') ||
                               extendedContextForDontDo.includes('## ❌ Don\'t Do This') ||
                               prevLines.includes('Don\'t Do This') || 
                               prevLines.includes('❌ Don\'t Do This') || 
                               prevLines.includes('### ❌') || 
                               prevLines.includes('Anti-Pattern') || 
                               prevLines.includes('Common Anti-Patterns') || 
                               isMarkedIncorrect;
    
    // Enhanced "Allowed Exceptions" detection - check section headers more thoroughly
    // Look back up to 50 lines to find the section header
    const extendedContext = lines.slice(Math.max(0, i - 50), i + 5).join('\n');
    
    // Check if the current line is inside a code block that's in the Allowed Exceptions section
    // This is important because code blocks can span multiple lines
    const isInAllowedExceptionsCodeBlock = codeBlockRanges.some(range => {
      // Note: range.start and range.end are 0-indexed, lineNum is 1-indexed
      // So we need to compare: lineNum (1-indexed) >= range.start + 1 (convert to 1-indexed)
      if (lineNum >= range.start + 1 && lineNum <= range.end + 1) {
        // Get the full code block content (including the opening and closing ```)
        const blockContent = lines.slice(range.start, range.end + 1).join('\n');
        // Look back from the code block start to find section headers (up to 50 lines)
        // range.start is 0-indexed, so we look back from there
        const blockStartContext = lines.slice(Math.max(0, range.start - 50), range.start).join('\n');
        // Check if code block contains comments indicating allowed usage
        const hasAllowedComment = blockContent.includes('NODE_ENV check allowed') ||
                                  blockContent.includes('check allowed for') ||
                                  blockContent.includes('allowed for build-time') ||
                                  blockContent.includes('allowed for dev-only') ||
                                  blockContent.includes('allowed for runtime');
        // Check if section header is present in context before code block
        const hasSectionHeader = blockStartContext.includes('## Allowed Exceptions for process.env Usage') ||
                                 blockStartContext.includes('Allowed Exceptions for process.env') ||
                                 blockStartContext.includes('### Build-time Optimization') ||
                                 blockStartContext.includes('### Dev-only Logging') ||
                                 blockStartContext.includes('### Runtime Compatibility');
        // Also check extended context around current line
        const hasSectionInExtendedContext = extendedContext.includes('## Allowed Exceptions for process.env Usage') ||
                                            extendedContext.includes('Allowed Exceptions for process.env') ||
                                            extendedContext.includes('### Build-time Optimization') ||
                                            extendedContext.includes('### Dev-only Logging') ||
                                            extendedContext.includes('### Runtime Compatibility');
        return hasAllowedComment || hasSectionHeader || hasSectionInExtendedContext;
      }
      return false;
    });
    
    // Check if we're in any code block that contains "allowed" comments
    // This is a direct check that doesn't rely on section headers
    const isInCodeBlockWithAllowedComment = codeBlockRanges.some(range => {
      const blockStartLine = range.start + 1;
      const blockEndLine = range.end + 1;
      if (lineNum >= blockStartLine && lineNum <= blockEndLine) {
        // Get the full code block content (including opening/closing ```)
        const blockContent = lines.slice(range.start, range.end + 1).join('\n');
        // Also check a few lines before the code block for section headers
        const preBlockContext = lines.slice(Math.max(0, range.start - 5), range.start).join('\n');
        // Check for allowed comment patterns in the code block
        const hasAllowedComment = blockContent.includes('NODE_ENV check allowed') ||
                                  blockContent.includes('check allowed for') ||
                                  blockContent.includes('allowed for build-time') ||
                                  blockContent.includes('allowed for dev-only') ||
                                  blockContent.includes('allowed for runtime');
        // Also check if there's a section header right before the code block
        const hasSectionHeader = preBlockContext.includes('### Build-time Optimization') ||
                                 preBlockContext.includes('### Dev-only Logging') ||
                                 preBlockContext.includes('### Runtime Compatibility') ||
                                 preBlockContext.includes('## Allowed Exceptions');
        return hasAllowedComment || hasSectionHeader;
      }
      return false;
    });
    
    const isInAllowedExceptions = extendedContext.includes('## Allowed Exceptions for process.env Usage') ||
                                  extendedContext.includes('Allowed Exceptions for process.env') ||
                                  extendedContext.includes('### Build-time Optimization') ||
                                  extendedContext.includes('### Dev-only Logging') ||
                                  extendedContext.includes('### Runtime Compatibility') ||
                                  context.includes('Allowed Exceptions') || 
                                  context.includes('Build-time Optimization') ||
                                  context.includes('Dev-only Logging') || 
                                  context.includes('Runtime Compatibility') ||
                                  context.includes('NODE_ENV check allowed') ||
                                  isInAllowedExceptionsCodeBlock ||
                                  isInCodeBlockWithAllowedComment;

    // Check test setup examples (beforeEach, afterEach, test setup)
    const isInTestCodeBlock = codeBlockRanges.some(range => {
      // Convert range to 1-indexed for comparison
      const blockStartLine = range.start + 1;
      const blockEndLine = range.end + 1;
      if (lineNum >= blockStartLine && lineNum <= blockEndLine) {
        // Get the content of this code block
        const blockContent = lines.slice(range.start, range.end + 1).join('\n');
        return blockContent.includes('beforeEach') ||
               blockContent.includes('afterEach') ||
               blockContent.includes('vi.resetModules') ||
               blockContent.includes('__resetContentSourceForTests');
      }
      return false;
    });
    
    const extendedContextForTest = lines.slice(Math.max(0, i - 50), i + 5).join('\n');
    const isInTestSection = extendedContextForTest.includes('Testing Source Selection') ||
                            extendedContextForTest.includes('Module Singletons') ||
                            context.includes('beforeEach') || 
                            context.includes('afterEach') || 
                            context.includes('test setup') || 
                            context.includes('Test setup') || 
                            context.includes('vi.resetModules') || 
                            context.includes('Test with intentional') ||
                            context.includes('__resetContentSourceForTests') ||
                            context.includes('Testing Source Selection') ||
                            isInTestCodeBlock;

    // Check config file examples (next.config, webpack.config, etc.)
    const extendedContextForConfig = lines.slice(Math.max(0, i - 50), i + 5).join('\n');
    const isInConfigSection = extendedContextForConfig.includes('**Option C: Conditional Webpack Usage**') ||
                              extendedContextForConfig.includes('Option C: Conditional Webpack') ||
                              extendedContextForConfig.includes('Conditional Webpack Usage') ||
                              context.includes('next.config') || 
                              context.includes('webpack.config') || 
                              context.includes('config file') ||
                              context.includes('nextConfig') || 
                              context.includes('Option C: Conditional Webpack') ||
                              context.includes('Conditional Webpack Usage') ||
                              context.includes('USE_WEBPACK');

    // Skip if in allowed sections (before pattern checking)
    // This must happen BEFORE the pattern checking loop to avoid false positives
    if (isInDontDoSection || isInAllowedExceptions || isInTestSection || isInConfigSection) {
      continue; // Skip to next line, don't check patterns at all
    }

    for (const { pattern, message, severity, allowInComments } of bannedPatterns) {
      // Skip if it's in a comment explaining the wrong way
      if (allowInComments && (line.includes('❌') || line.includes('INCORRECT') || line.includes('// ❌') || line.includes('// ❌'))) {
        continue;
      }



      // Skip if it's in "Before (Legacy)" migration examples
      if (context.includes('Before (Legacy') || context.includes('❌ OLD:') || context.includes('Legacy Direct Access')) {
        continue;
      }

      // Skip if it's in a code reference block (showing actual code from codebase)
      if (isInCodeReference(lineNum)) {
        continue;
      }
      
      if (filePath.includes('audits/')) {
        // Check if it's showing code from a specific file (indicated by file path references)
        // Code references use format: ```startLine:endLine:filepath
        const hasCodeReference = /```\d+:\d+:[^\s]+/.test(prevLines) || 
                                 /```\d+:\d+:[^\s]+/.test(nextLines) ||
                                 /```\d+:\d+:[^\s]+/.test(context);
        const hasEvidencePattern = /lib\/[^\s]+:\s*line\s*~?\d+/.test(context) ||
                                  prevLines.includes('Evidence examples') ||
                                  prevLines.includes('from scan') ||
                                  context.includes('Evidence examples (from scan)') ||
                                  // List items showing evidence: "- lib/path/file.ts: line ~44: `code`"
                                  isEvidenceLine ||
                                  // Any line after "Evidence examples" section header (within 10 lines)
                                  (prevLines.includes('Evidence examples') && line.includes('process.env'));
        // Check if line is in a code block that starts with a code reference
        const isInCodeRefBlock = isInCodeReference(lineNum);
        // Check if we're inside any code block in an audit doc (audit docs show actual code)
        const isInAnyCodeBlock = codeBlockRanges.some(range => 
          lineNum >= range.start && lineNum <= range.end
        );
        // In audit docs, skip if:
        // 1. Line contains evidence pattern (file path with line number)
        // 2. Line is in any code block
        // 3. Context includes file paths or code references
        if (isEvidenceLine || isInAnyCodeBlock || hasCodeReference || hasEvidencePattern || isInCodeRefBlock ||
            context.includes('lib/') || context.includes('components/') || context.includes('app/')) {
          continue;
        }
      }

      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        // Check whitelist before creating issue (try both path formats)
        const whitelistKey1 = `${normalizedFilePath}:${lineNum}`;
        const whitelistKey2 = `${filePath}:${lineNum}`;
        if (!whitelist.has(whitelistKey1) && !whitelist.has(whitelistKey2)) {
          issues.push({
            file: filePath,
            line: lineNum,
            issue: message,
            severity,
          });
        }
      }
    }
  }

  return issues;
}

