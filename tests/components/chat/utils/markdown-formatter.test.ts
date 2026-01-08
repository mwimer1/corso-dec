// tests/components/chat/utils/markdown-formatter.test.ts
// Tests for enhanced markdown formatter with XSS safety

import { describe, expect, it } from 'vitest';
import { formatMarkdown } from '@/components/chat/utils/markdown-formatter';

describe('formatMarkdown', () => {
  describe('Basic markdown constructs', () => {
    it('formats headings', () => {
      const result = formatMarkdown('# Heading 1\n## Heading 2\n### Heading 3');
      expect(result).toContain('<h1>Heading 1</h1>');
      expect(result).toContain('<h2>Heading 2</h2>');
      expect(result).toContain('<h3>Heading 3</h3>');
    });

    it('formats bold text', () => {
      const result = formatMarkdown('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('formats italic text', () => {
      const result = formatMarkdown('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    it('formats lists', () => {
      const result = formatMarkdown('- Item 1\n- Item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
    });

    it('formats paragraphs', () => {
      const result = formatMarkdown('Paragraph 1\n\nParagraph 2');
      expect(result).toContain('<p>Paragraph 1</p>');
      expect(result).toContain('<p>Paragraph 2</p>');
    });
  });

  describe('Enhanced features (S2-T6)', () => {
    it('formats code blocks', () => {
      const result = formatMarkdown('```\nconst x = 1;\n```');
      expect(result).toContain('<pre><code>');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('</code></pre>');
    });

    it('formats inline code', () => {
      const result = formatMarkdown('Use `console.log()` to debug');
      expect(result).toContain('<code>console.log()</code>');
    });

    it('formats links', () => {
      const result = formatMarkdown('Visit [Corso](https://corso.app)');
      expect(result).toContain('<a href="https://corso.app"');
      expect(result).toContain('>Corso</a>');
    });

    it('formats tables', () => {
      const result = formatMarkdown('| Col1 | Col2 |\n|------|------|\n| Val1 | Val2 |');
      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('<tr>');
      expect(result).toContain('<td>Col1</td>');
    });
  });

  describe('XSS prevention', () => {
    it('escapes script tags in text', () => {
      const result = formatMarkdown('Hello <script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('escapes img onerror in text', () => {
      const result = formatMarkdown('Image: <img src=x onerror=alert(1)>');
      expect(result).not.toContain('onerror');
      expect(result).toContain('&lt;img');
    });

    it('rejects javascript: links', () => {
      const result = formatMarkdown('[Click me](javascript:alert("xss"))');
      // Should sanitize javascript: to #
      expect(result).not.toContain('javascript:');
      expect(result).toContain('href="#');
    });

    it('escapes HTML in code blocks', () => {
      const result = formatMarkdown('```\n<script>alert(1)</script>\n```');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('escapes HTML in table cells', () => {
      const result = formatMarkdown('| <script>alert(1)</script> |');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('Link security', () => {
    it('adds rel="noopener noreferrer" to external links', () => {
      const result = formatMarkdown('[External](https://example.com)');
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('target="_blank"');
    });

    it('allows relative links without target', () => {
      const result = formatMarkdown('[Relative](/path)');
      expect(result).not.toContain('target="_blank"');
      expect(result).toContain('href="/path"');
    });

    it('rejects data: URLs', () => {
      const result = formatMarkdown('[Data](data:text/html,<script>alert(1)</script>)');
      expect(result).toContain('href="#');
      expect(result).not.toContain('data:');
    });
  });
});
