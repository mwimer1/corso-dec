/**
 * Enhanced Markdown Formatter for Chat Messages
 * 
 * Lightweight markdown-to-HTML converter for Deep Research responses.
 * Handles: headings, bold, italic, lists, paragraphs, code blocks, tables, and links.
 * 
 * Security: All output is sanitized via DOMPurify before rendering.
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Sanitizes URL to prevent javascript: and other dangerous protocols
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Reject dangerous protocols
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
    return '#';
  }
  // Allow http, https, mailto, relative paths, and anchors
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) {
    return trimmed;
  }
  // Default to safe relative path
  return '#';
}

/**
 * Converts markdown text to HTML
 * Supports: headings, bold, italic, lists, paragraphs, code blocks, tables, links
 */
export function formatMarkdown(text: string): string {
  if (!text) return '';

  // Split into lines for processing
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const trimmed = line.trim();

    // Code blocks: ```code```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const code = codeBlockContent.join('\n');
        processedLines.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Open code block
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        inCodeBlock = true;
        // Optional language identifier after ```
        const lang = trimmed.slice(3).trim();
        if (lang) {
          // Language hint can be used for syntax highlighting (not implemented here)
          // Just continue to collect code content
        }
      }
      continue;
    }

    if (inCodeBlock) {
      // Collect code block content (don't process markdown inside)
      codeBlockContent.push(line);
      continue;
    }

    // Tables: GitHub-flavored markdown (| col1 | col2 |)
    const tableMatch = trimmed.match(/^\|(.+)\|$/);
    if (tableMatch && tableMatch[1]) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      
      const cells = tableMatch[1].split('|').map(c => c.trim()).filter(c => c);
      
      // Check if this is a header separator row (|---|)
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        // Skip separator row, but mark that we're in a table
        // We'll track table state by checking for previous table rows
        continue;
      }
      
      // Regular table row
      const rowHtml = cells.map(cell => `<td>${escapeHtml(cell)}</td>`).join('');
      processedLines.push(`<tr>${rowHtml}</tr>`);
      continue;
    }

    // Headings (must be at start of line)
    if (trimmed.match(/^###\s+/)) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      const headingText = trimmed.replace(/^###\s+/, '');
      processedLines.push(`<h3>${escapeHtml(headingText)}</h3>`);
      continue;
    }
    if (trimmed.match(/^##\s+/)) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      const headingText = trimmed.replace(/^##\s+/, '');
      processedLines.push(`<h2>${escapeHtml(headingText)}</h2>`);
      continue;
    }
    if (trimmed.match(/^#\s+/)) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      const headingText = trimmed.replace(/^#\s+/, '');
      processedLines.push(`<h1>${escapeHtml(headingText)}</h1>`);
      continue;
    }

    // Lists (numbered or bulleted) - must be at start of line
    const listMatch = trimmed.match(/^(\d+\.|\-|\*)\s+(.+)$/);
    if (listMatch && listMatch[2]) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(`<li>${escapeHtml(listMatch[2])}</li>`);
      continue;
    }

    // Close list if we hit a non-list line
    if (inList && trimmed !== '') {
      processedLines.push('</ul>');
      inList = false;
    }

    // Regular paragraphs
    if (trimmed !== '') {
      processedLines.push(`<p>${escapeHtml(trimmed)}</p>`);
    } else {
      processedLines.push('<br>');
    }
  }

  // Close any open code block
  if (inCodeBlock) {
    const code = codeBlockContent.join('\n');
    processedLines.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
  }

  // Close any open list
  if (inList) {
    processedLines.push('</ul>');
  }

  let html = processedLines.join('\n');

  // Process inline formatting (bold, italic, links) - must be done after escaping
  // Bold: **text** or __text__ (handle multiple in one line)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_ (but not if it's part of **text**)
  // Use negative lookbehind/lookahead to avoid matching bold markers
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');

  // Links: [text](url) or [text](url "title")
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const sanitizedUrl = sanitizeUrl(url);
    const escapedText = escapeHtml(text);
    // Add rel="noopener noreferrer" for security on external links
    const isExternal = /^https?:/i.test(sanitizedUrl);
    const rel = isExternal ? ' rel="noopener noreferrer"' : '';
    return `<a href="${sanitizedUrl}"${rel}>${escapedText}</a>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Wrap table rows in table structure
  // This is a simple approach - group consecutive <tr> tags
  html = html.replace(/(<tr>.*?<\/tr>(?:\s*<tr>.*?<\/tr>)*)/g, (match) => {
    // Check if already wrapped
    if (match.includes('<table>')) {
      return match;
    }
    return `<table><thead>${match.match(/<tr>.*?<\/tr>/)?.[0] || ''}</thead><tbody>${match.replace(/<tr>.*?<\/tr>/, '').trim()}</tbody></table>`;
  });

  // Simple table wrapper: if we have <tr> tags, wrap first row as header
  // This is a basic implementation - full table parsing would be more complex
  const trMatches = html.match(/<tr>.*?<\/tr>/g);
  if (trMatches && trMatches.length > 0) {
    // Check if not already wrapped
    if (!html.includes('<table>')) {
      const firstRow = trMatches[0];
      const restRows = trMatches.slice(1).join('');
      html = html.replace(
        /<tr>.*?<\/tr>(?:\s*<tr>.*?<\/tr>)*/,
        `<table><thead>${firstRow}</thead><tbody>${restRows}</tbody></table>`
      );
    }
  }

  return html;
}
