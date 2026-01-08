#!/usr/bin/env tsx
// scripts/enhance-readmes.ts
// Enhance ALL README files with rich content, proper frontmatter, and consistent structure

import fsSync, { promises as fs } from 'node:fs';
import path from 'node:path';
import { inferLastUpdated, normalizeDate, parseMd, stringifyMd } from './_utils/frontmatter';
import { findMarkdownFiles } from './_utils/globs';

interface ReadmeMetadata {
  title: string;
  description: string;
  directory: string;
  category: string;
  lastUpdated?: string;
}

// Enhanced content templates for different directory types
const getEnhancedContent = (metadata: ReadmeMetadata, relatedLinks: { title: string; path: string }[] = []): string => {
  const { title, description, directory, category } = metadata;

  const frontMatter = ``;

  // Build related links section safely — only include links that look like local files or known external URLs
  const sanitizedLinks = relatedLinks
    .map(l => {
      // If it's an absolute URL, keep it as-is
      if (/^https?:\/\//.test(l.path)) return { title: l.title, path: l.path };

      // Normalize backslashes and remove redundant ./
      let p = l.path.replace(/\\/g, '/').replace(/^\.\//, '');

      // If path is already absolute within repo (starts with '/'), convert to relative from directory
      if (p.startsWith('/')) {
        // convert to relative path from README directory
        p = path.relative(directory, path.join(process.cwd(), p)).replace(/\\/g, '/');
      }

      // If path refers to a file that exists relative to the README directory, keep it
      try {
        const candidate = path.join(directory, p);
        if (fsSync.existsSync(candidate)) {
          return { title: l.title, path: p };
        }
      } catch {
        // fallthrough
      }

      // Otherwise, don't include this link (avoid placeholders)
      return null;
    })
    .filter(Boolean) as { title: string; path: string }[];

  const relatedSection = sanitizedLinks.length
    ? sanitizedLinks.map(l => `- [${l.title}](${l.path}) -`).join('\n') + '\n'
    : '';

  const baseContent = `# ${title}

> **${description}**

## 📋 Quick Reference

**Key Points:**

- **[Key Concept 1]**: [Brief explanation of primary concept]
- **[Key Concept 2]**: [Brief explanation of secondary concept]  
- **[Key Concept 3]**: [Brief explanation of tertiary concept]

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Related Documentation](#related-documentation)

---

## Overview

[Detailed overview of this directory/component and its purpose within the Corso platform]

### Architecture

[Brief architectural explanation of how this fits into the broader system]

## Key Features

### Feature 1
[Description of primary feature]

### Feature 2  
[Description of secondary feature]

### Feature 3
[Description of tertiary feature]

## Usage Examples

### Basic Usage
\`\`\`typescript
// Example code demonstrating basic usage
export function exampleFunction() {
  // Implementation details
}
\`\`\`

### Advanced Usage
\`\`\`typescript
// More complex example showing advanced patterns
export function advancedExample() {
  // Advanced implementation
}
\`\`\`

## Best Practices

- ✅ **Good**: [Example of correct approach]
- ❌ **Bad**: [Example of what to avoid]

### Common Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| Pattern 1 | What it does | \`code example\` |
| Pattern 2 | What it does | \`code example\` |
| Pattern 3 | What it does | \`code example\` |

## Development Guidelines

### File Organization
[Guidelines for organizing files in this directory]

### Naming Conventions
[Naming conventions specific to this area]

### Testing Strategy
[Testing approach for this component/directory]

---

## 🎯 Key Takeaways

- **[Main Point 1]**: [Brief summary of the most important concept]
- **[Main Point 2]**: [Brief summary of another key concept]
- **[Main Point 3]**: [Brief summary of final key concept]

## 📚 Related Documentation

${relatedSection}

## 🏷️ Tags

\`#${category.toLowerCase()}\` \`#documentation\` \`#corso-platform\`

---

_Last updated: {{LAST_UPDATED}}_`;

  return frontMatter + baseContent;
};

// Categorize directories
const categorizeDirectory = (dirPath: string): string => {
  const dir = dirPath.toLowerCase();
  
  if (dir.includes('component') || dir.includes('atoms') || dir.includes('molecules') || dir.includes('organisms')) {
    return 'components';
  }
  if (dir.includes('action') || dir.includes('server')) {
    return 'actions';
  }
  if (dir.includes('hook') || dir.includes('context')) {
    return 'react';
  }
  if (dir.includes('lib') || dir.includes('util')) {
    return 'library';
  }
  if (dir.includes('test') || dir.includes('spec')) {
    return 'testing';
  }
  if (dir.includes('config') || dir.includes('setup')) {
    return 'configuration';
  }
  if (dir.includes('style') || dir.includes('css')) {
    return 'styling';
  }
  if (dir.includes('type')) {
    return 'types';
  }
  if (dir.includes('doc')) {
    return 'documentation';
  }
  if (dir.includes('api') || dir.includes('endpoint')) {
    return 'api';
  }
  if (dir.includes('script')) {
    return 'automation';
  }
  if (dir.includes('github') || dir.includes('workflow')) {
    return 'ci-cd';
  }
  if (dir.includes('eslint') || dir.includes('plugin')) {
    return 'linting';
  }
  if (dir.includes('stories') || dir.includes('storybook')) {
    return 'ui-development';
  }
  if (dir.includes('styles') || dir.includes('css') || dir.includes('tokens')) {
    return 'styling';
  }
  if (dir.includes('vscode') || dir.includes('editor')) {
    return 'editor-config';
  }
  if (dir.includes('storybook') || dir.includes('stories')) {
    return 'ui-development';
  }
  if (dir.includes('public') || dir.includes('assets')) {
    return 'static-assets';
  }
  if (dir.includes('husky') || dir.includes('git-hooks')) {
    return 'git-hooks';
  }
  if (dir.includes('cursor') || dir.includes('ai-rules')) {
    return 'ai-development';
  }
  
  return 'development';
};

// Generate title from directory path
const generateTitle = (filePath: string): string => {
  const dir = path.dirname(filePath);
  const segments = dir.split(path.sep).filter(s => s && s !== '.');
  
  if (segments.length === 0) return 'Corso Platform';
  
  const lastSegment = segments[segments.length - 1];
  
  if (!lastSegment) return 'Corso Platform';
  
  // Special cases
  const titleMap: Record<string, string> = {
    'actions': 'Server Actions',
    'components': 'UI Components',
    'hooks': 'React Hooks',
    'contexts': 'React Contexts',
    'lib': 'Core Libraries',
    'utils': 'Utility Functions',
    'types': 'TypeScript Types',
    'styles': 'Styling System',
    'tests': 'Test Suite',
    'scripts': 'Automation Scripts',
    'docs': 'Documentation',
    'config': 'Configuration',
    'api': 'API Endpoints',
    'app': 'Application Routes',
    'middleware': 'Middleware Functions',
    'public': 'Static Assets',
    'supabase': 'Database Schema',
    'stories': 'Storybook Stories',
    '.github': 'GitHub Configuration',
    '.devcontainer': 'Development Environment',
    '.storybook': 'Storybook Configuration',
    '.vscode': 'VS Code Configuration',
    '.husky': 'Git Hooks',
    '.cursor': 'Cursor AI Rules',
    'eslint-plugin-corso': 'ESLint Plugin'
  };
  
  if (titleMap[lastSegment]) {
    return titleMap[lastSegment];
  }
  
  // Convert to title case
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Generate description based on directory and content
const generateDescription = (filePath: string, title: string): string => {
  const dir = path.dirname(filePath);
  const category = categorizeDirectory(dir);
  
  const descriptionMap: Record<string, string> = {
    'components': `UI components for the ${title} system, following atomic design principles and design system standards.`,
    'actions': `Server-side actions for ${title.toLowerCase()}, handling data mutations and business logic.`,
    'react': `React ${title.toLowerCase()} providing state management and shared functionality across components.`,
    'library': `Core ${title.toLowerCase()} providing essential functionality and utilities for the Corso platform.`,
    'testing': `Test suite for ${title.toLowerCase()}, ensuring code quality and functionality.`,
    'configuration': `Configuration files and setup utilities for ${title.toLowerCase()}.`,
    'styling': `Styling system for ${title.toLowerCase()}, using Tailwind CSS and design tokens.`,
    'types': `TypeScript type definitions for ${title.toLowerCase()}, ensuring type safety across the platform.`,
    'documentation': `Documentation for ${title.toLowerCase()}, providing guides and reference materials.`,
    'api': `API endpoints for ${title.toLowerCase()}, handling HTTP requests and responses.`,
    'automation': `Automation scripts for ${title.toLowerCase()}, streamlining development workflows.`,
    'ci-cd': `CI/CD configuration for ${title.toLowerCase()}, managing build and deployment processes.`,
    'editor-config': `Editor configuration for ${title.toLowerCase()}, optimizing development environment and workflow.`,
    'ui-development': `UI development tools for ${title.toLowerCase()}, supporting component documentation and testing.`,
    'static-assets': `Static assets for ${title.toLowerCase()}, including images, icons, and public resources.`,
    'git-hooks': `Git hooks for ${title.toLowerCase()}, automating development workflow and code quality checks.`,
    'ai-development': `AI development rules for ${title.toLowerCase()}, ensuring consistent code quality and development practices.`,
    'development': `Development resources for ${title.toLowerCase()}, supporting the development workflow.`
  };
  
  return descriptionMap[category] || `${title} for the Corso platform, providing essential functionality and resources.`;
};

// Check if README is already enhanced (has frontmatter)
const isAlreadyEnhanced = (content: string): boolean => {
  return /^\s*---/m.test(content) && /\btitle:\s*/.test(content) && /\bdescription:\s*/.test(content);
};

// Main enhancement function
async function enhanceAllReadmes({ write = false }: { write?: boolean } = { write: false }) {
  console.log('🚀 Starting comprehensive README enhancement... (dry-run=', !write, ')');
  
  const readmeFiles = await findMarkdownFiles(['**/README.md']);
  
  console.log(`📄 Found ${readmeFiles.length} README files to process`);
  
  let enhancedCount = 0;
  let skippedCount = 0;
  
  for (const file of readmeFiles) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = parseMd(raw);
      
      // Skip if already enhanced
      if (isAlreadyEnhanced(raw)) {
        console.log(`⏭️  Skipping ${file} (already enhanced)`);
        skippedCount++;
        continue;
      }
      
      // Generate metadata
      const title = generateTitle(file);
      const description = generateDescription(file, title);
      const directory = path.dirname(file);
      const category = categorizeDirectory(directory);
      
      // Generate enhanced content
      const enhancedBody = getEnhancedContent({ title, description, directory, category });
      const existing = normalizeDate(parsed.data?.['last_updated']);
      const inferred = await inferLastUpdated(file, true);
      const chosen = existing && inferred ? (existing > inferred ? existing : inferred) : (existing ?? inferred);
      const next = stringifyMd({ ...parsed.data, title, description, category, last_updated: chosen }, enhancedBody.replace('{{LAST_UPDATED}}', chosen ?? ''));
      
      // Write enhanced content only when write === true
      if (write) {
        await fs.writeFile(file, next, 'utf8');
        console.log(`✅ Enhanced ${file} (${title})`);
        enhancedCount++;
      } else {
        console.log(`🔎 Would enhance: ${file} (${title})`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to enhance ${file}:`, error);
    }
  }
  
  console.log(`\n🎉 README enhancement complete!`);
  console.log(`✅ Enhanced: ${enhancedCount} files`);
  console.log(`⏭️  Skipped: ${skippedCount} files (already enhanced)`);
  console.log(`📄 Total processed: ${readmeFiles.length} files`);
}

// Main execution
async function main() {
  try {
    await enhanceAllReadmes();
    console.log('✅ README enhancement script finished successfully.');
  } catch (error) {
    console.error('❌ Script failed:', (error as Error).message);
    process.exit(1);
  }
}

void main().catch(err => {
  console.error('❌ Script failed:', (err as Error).message);
  process.exit(1);
});

