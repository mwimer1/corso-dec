// lib/marketing/insights/content-loader.ts
// Standalone content loader for markdown files (extracted to break circular dependency)
import 'server-only';

import type { InsightItem, InsightPreview } from '@/types/marketing';
import type { ISODateString } from '@/types/shared';
import fs from 'fs/promises';
import matter from 'gray-matter';
import { defaultSchema } from 'hast-util-sanitize';
import path from 'path';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'insights');
const ARTICLES_DIR = path.join(CONTENT_ROOT, 'articles');

interface FrontmatterShape {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  publishDate?: string;
  updatedDate?: string;
  imageUrl?: string;
  heroCaption?: string;
  categories?: Array<{ slug: string; name: string }>;
  author?: { name: string; avatar?: string };
  status?: 'draft' | 'published';
}

async function directoryExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function fmToPreview(data: FrontmatterShape, readingTime?: number): InsightPreview {
  const preview: InsightPreview = {
    id: data.id ?? data.slug,
    slug: data.slug,
    title: data.title,
  };

  if (typeof data.description === 'string' && data.description.length > 0) {
    preview.description = data.description;
  }

  if (data.publishDate) preview.publishDate = data.publishDate as ISODateString;
  if (data.updatedDate) preview.updatedDate = data.updatedDate as ISODateString;
  if (data.imageUrl) preview.imageUrl = data.imageUrl;
  if (data.categories) preview.categories = data.categories;
  if (readingTime !== undefined) preview.readingTime = readingTime;
  if (data.author) preview.author = data.author;

  return preview;
}

function fmToItem(data: FrontmatterShape, html: string, readingTime?: number): InsightItem {
  const base = fmToPreview(data, readingTime);
  const item: InsightItem = {
    ...base,
    content: html,
  };

  if (typeof data.heroCaption === 'string' && data.heroCaption.length > 0) {
    item.heroCaption = data.heroCaption;
  }

  return item;
}

/**
 * Minimal Markdown→HTML fallback. For production we should switch to remark/rehype.
 * Here we preserve existing behavior (InsightDetail expects HTML) by applying a
 * conservative conversion for common paragraphs and headings, leaving advanced
 * markdown features as-is.
 */
function markdownToHtmlLoose(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  return lines
    .map((line) => {
      if (/^\s*$/.test(line)) return '';
      if (/^#\s+/.test(line)) return `<h1>${line.replace(/^#\s+/, '')}</h1>`;
      if (/^##\s+/.test(line)) return `<h2>${line.replace(/^##\s+/, '')}</h2>`;
      if (/^###\s+/.test(line)) return `<h3>${line.replace(/^###\s+/, '')}</h3>`;
      return `<p>${line}</p>`;
    })
    .join('\n');
}

async function markdownToHtmlRich(markdown: string): Promise<string> {
  try {
    // Extend the default schema to allow 'id' attributes on heading elements
    const customSchema = {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        h1: ['id'],
        h2: ['id'],
        h3: ['id'],
        h4: ['id'],
        h5: ['id'],
        h6: ['id'],
      },
    };

    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeSanitize, customSchema)
      .use(rehypeStringify)
      .process(markdown);
    return String(file);
  } catch {
    // Fallback to loose converter on pipeline errors
    return markdownToHtmlLoose(markdown);
  }
}

/**
 * Load insights from markdown files in content/insights/articles/
 * Used by legacy adapter for markdown-based content
 */
export async function loadFromContentDir(): Promise<InsightItem[]> {
  if (!(await directoryExists(ARTICLES_DIR))) return [];
  const entries = await fs.readdir(ARTICLES_DIR);
  const files = entries.filter((f) => /\.(md|mdx)$/i.test(f));
  const items: InsightItem[] = [];

  for (const file of files) {
    const full = path.join(ARTICLES_DIR, file);
    const raw = await fs.readFile(full, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data as FrontmatterShape;
    if (!data?.slug || !data?.title) continue;
    if (data.status && data.status !== 'published') continue;

    // For now, convert markdown body to simple HTML to match InsightDetail expectations
    const rawMd = parsed.content ?? '';
    const html = await markdownToHtmlRich(rawMd);
    const words = rawMd.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.round(words / 200));
    const item = fmToItem(data, html, readingTimeMin);
    items.push(item);
  }

  // Sort by publishDate desc when available
  const ts = (d?: string | number | Date) => (d ? new Date(d).getTime() : 0);
  items.sort((a, b) => ts(b.publishDate) - ts(a.publishDate));

  return items;
}











