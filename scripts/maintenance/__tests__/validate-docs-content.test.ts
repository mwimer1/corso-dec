import { describe, expect, it } from 'vitest';
import { checkBannedPatterns, extractCodeBlocks } from '../validate-docs-content.utils';

describe('validate-docs-content', () => {
  describe('extractCodeBlocks', () => {
    it('should extract simple code blocks', () => {
      const content = `
# Title

\`\`\`typescript
const x = 1;
\`\`\`
`;
      const blocks = extractCodeBlocks(content, 'test.md');
      expect(blocks).toHaveLength(1);
      expect(blocks[0]?.language).toBe('typescript');
      expect(blocks[0]?.content).toContain('const x = 1');
    });

    it('should extract multiple code blocks', () => {
      const content = `
\`\`\`typescript
const a = 1;
\`\`\`

\`\`\`javascript
const b = 2;
\`\`\`
`;
      const blocks = extractCodeBlocks(content, 'test.md');
      expect(blocks).toHaveLength(2);
    });

    it('should handle code blocks without language', () => {
      const content = `
\`\`\`
const x = 1;
\`\`\`
`;
      const blocks = extractCodeBlocks(content, 'test.md');
      expect(blocks).toHaveLength(1);
      expect(blocks[0]?.language).toBeUndefined();
    });
  });

  describe('checkBannedPatterns', () => {
    it('should detect process.env usage', () => {
      const content = `const key = process.env.API_KEY;`;
      const issues = checkBannedPatterns(content, 'test.md');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.issue.includes('process.env'))).toBe(true);
    });

    it('should allow process.env in examples showing wrong way', () => {
      const content = `// ❌ INCORRECT: const key = process.env.API_KEY;`;
      const issues = checkBannedPatterns(content, 'test.md');
      expect(issues.length).toBe(0);
    });

    it('should detect process.env array access', () => {
      const content = `const key = process.env['API_KEY'];`;
      const issues = checkBannedPatterns(content, 'test.md');
      expect(issues.length).toBeGreaterThan(0);
    });
  });
});

