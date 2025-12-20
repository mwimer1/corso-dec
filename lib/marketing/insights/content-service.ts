// lib/marketing/insights/content-service.ts
// Server-only content loader for Insights with safe fallbacks to static data.
import 'server-only';

import { getEnv } from '@/lib/server/env';
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
// import { z } from 'zod' // (removed: no longer used)
import { CATEGORIES, staticInsights } from './static-data';
// If integrating a CMS, import or require its SDK or API client here (future enhancement)

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

async function loadFromContentDir(): Promise<InsightItem[]> {
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

export async function getAllInsights(): Promise<InsightPreview[]> {
  const source = getEnv().INSIGHTS_SOURCE?.toLowerCase();
  if (source === 'cms') {
    // TODO: Integrate CMS content fetch. Using static data as placeholder.
    console.warn("INSIGHTS_SOURCE=cms – returning static insights as placeholder (CMS integration not implemented).");
    return staticInsights.map((i): InsightPreview => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      ...(i.description && { description: i.description }),
      ...(i.publishDate && { publishDate: i.publishDate }),
      ...(i.imageUrl && { imageUrl: i.imageUrl }),
      ...(i.categories && { categories: i.categories }),
      ...(i.readingTime !== undefined && { readingTime: i.readingTime }),
      ...(i.author && { author: i.author }),
    }));
  }
  if (source === 'mock') {
    // Use static mock data explicitly
    return staticInsights.map((i): InsightPreview => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      ...(i.description && { description: i.description }),
      ...(i.publishDate && { publishDate: i.publishDate }),
      ...(i.imageUrl && { imageUrl: i.imageUrl }),
      ...(i.categories && { categories: i.categories }),
      ...(i.readingTime !== undefined && { readingTime: i.readingTime }),
      ...(i.author && { author: i.author }),
    }));
  }
  // Default: try to load from local markdown files, fall back to static if none
  const contentItems = await loadFromContentDir();
  if (contentItems.length > 0) {
    return contentItems.map((i): InsightPreview => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      ...(i.description && { description: i.description }),
      ...(i.publishDate && { publishDate: i.publishDate }),
      ...(i.imageUrl && { imageUrl: i.imageUrl }),
      ...(i.categories && { categories: i.categories }),
      ...(i.readingTime !== undefined && { readingTime: i.readingTime }),
      ...(i.author && { author: i.author }),
    }));
  }
  // No content files found, use static data as last resort
  return staticInsights.map((i): InsightPreview => ({
    id: i.id,
    slug: i.slug,
    title: i.title,
    ...(i.description && { description: i.description }),
    ...(i.publishDate && { publishDate: i.publishDate }),
    ...(i.imageUrl && { imageUrl: i.imageUrl }),
    ...(i.categories && { categories: i.categories }),
    ...(i.readingTime !== undefined && { readingTime: i.readingTime }),
    ...(i.author && { author: i.author }),
  }));
}

export async function getInsightBySlug(slug: string): Promise<InsightItem | undefined> {
  const source = getEnv().INSIGHTS_SOURCE?.toLowerCase();
  if (source === 'cms' || source === 'mock') {
    // In CMS or mock mode, look up in static insights (assuming no markdown content)
    return staticInsights.find((i) => i.slug === slug);
  }
  const contentItems = await loadFromContentDir();
  if (contentItems.length > 0) {
    return contentItems.find((i) => i.slug === slug);
  }
  return staticInsights.find((i) => i.slug === slug);
}

/**
 * Collect categories across all available content (frontmatter) or static fallback.
 */
export async function getCategories(): Promise<Array<{ slug: string; name: string }>> {
  const source = getEnv().INSIGHTS_SOURCE?.toLowerCase();
  if (source === 'cms' || source === 'mock') {
    // Use static categories in CMS or mock mode (assuming no dynamic content)
    return CATEGORIES;
  }
  const contentItems = await loadFromContentDir();
  const dataSource = contentItems.length > 0 ? contentItems : staticInsights;
  const map = new Map<string, string>();
  for (const it of dataSource) {
    for (const c of it.categories ?? []) {
      if (!map.has(c.slug)) {
        map.set(c.slug, c.name);
      }
    }
  }
  return Array.from(map, ([slug, name]) => ({ slug, name }));
}

// --- Category filtering helpers (non-breaking additions) ---
// (CategoryInfo removed — not referenced)

type CategoryInput = string | { slug: string; name: string };

export const categorySlugify = (input: CategoryInput): string => {
  const name = typeof input === 'string' ? input : input.name;
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// (GetByCategoryOpts removed — not referenced)

export type GetByCategoryParams = { slug: string; page?: number; pageSize?: number };

export async function getInsightsByCategory({ slug, page = 1, pageSize = 10 }: GetByCategoryParams) {
  const category = CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase()) ?? null;
  if (!category) return { items: [], total: 0, category: null };

  const ts = (d?: string | number | Date) => (d ? new Date(d).getTime() : 0);
  const all = staticInsights
    .filter(i => (i.categories || []).some(cat => cat.slug?.toLowerCase() === slug.toLowerCase()))
    .sort((a, b) => ts(b.publishDate) - ts(a.publishDate));

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = all.slice(start, end);
  return { items, total: all.length, category };
}

// For internal use, allow undefined avatar when constructing

/**
 * Get related insights based on category overlap and recency.
 */
export async function getRelatedInsights(
  item: InsightItem,
  opts?: { limit?: number }
): Promise<InsightPreview[]> {
  const { limit = 3 } = opts ?? {};
  const all = await getAllInsights();

  // Remove the current item from consideration
  const others = all.filter(i => i.id !== item.id);

  // Score by category overlap and recency
  const scored = others.map(insight => {
    let score = 0;

    // Category overlap scoring
    const itemCats = (item.categories ?? []).map((c: { slug: string }) => c.slug);
    const insightCats = (insight.categories ?? []).map((c: { slug: string }) => c.slug);
    const overlap = itemCats.filter((cat: string) => insightCats.includes(cat)).length;
    score += overlap * 2; // 2 points per category overlap

    // Recency scoring (newer items get higher score)
    if (insight.publishDate) {
      const daysDiff = (Date.now() - new Date(insight.publishDate).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 30 - daysDiff); // Lose 1 point per day, max 30 days back
      score += Math.max(0, recencyScore);
    }

    return { insight, score };
  });

  // Sort by score (descending) and return top items
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ insight }) => insight);
}



