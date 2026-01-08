import matter from 'gray-matter';
import { promises as fs } from 'node:fs';

export type ParsedMarkdown = {
  data: Record<string, unknown>;
  content: string;
  hasFrontmatter: boolean;
};

function stripBOM(input: string): string {
  if (!input) return input;
  return input.replace(/^\uFEFF/, '');
}

/**
 * Parses Markdown with YAML frontmatter using gray-matter.
 * Accepts BOM/leading whitespace for parsing without mutating returned content semantics.
 */
export function parseMd(src: string): ParsedMarkdown {
  const normalized = stripBOM(src);
  // Allow a few leading blank lines before frontmatter for tolerant parsing
  const leadingTrimmed = normalized.replace(/^(?:\s*\n)+(?=---\s*\n)/, '');
  const parsed = matter(leadingTrimmed, { delimiters: '---' });
  const hasFrontmatter = /^\s*---\s*\n/.test(normalized);
  return {
    data: parsed.data ?? {},
    content: parsed.content ?? '',
    hasFrontmatter,
  };
}

/**
 * Normalizes a date-like value into YYYY-MM-DD (UTC) or undefined if invalid.
 */
export function normalizeDate(value?: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    // Try ISO or common formats first
    const s = value.trim();
    // Direct YYYY-MM-DD pattern
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      const y = parseInt(ymd[1] as string, 10);
      const m = parseInt(ymd[2] as string, 10) - 1;
      const day = parseInt(ymd[3] as string, 10);
      const d = new Date(Date.UTC(y, m, day));
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * Attempts to infer last_updated from file mtime. If fallbackNow=true and mtime is unavailable,
 * uses today's UTC date.
 */
export async function inferLastUpdated(filepath: string, fallbackNow = false): Promise<string | undefined> {
  try {
    const st = await fs.stat(filepath);
    return normalizeDate(st.mtime);
  } catch {
    if (fallbackNow) {
      return new Date().toISOString().slice(0, 10);
    }
    return undefined;
  }
}

/**
 * Stringifies Markdown with YAML frontmatter in a stable way.
 * Keeps important keys at the top if present and sorts the rest alphabetically.
 * Ensures the document ends with exactly one trailing newline.
 */
export function stringifyMd(data: Record<string, unknown>, content: string): string {
  const pinnedOrder = ['title', 'description', 'tags', 'owner', 'last_updated'];
  const entries = Object.entries(data ?? {});
  const pinned: [string, unknown][] = [];
  const rest: [string, unknown][] = [];
  for (const [k, v] of entries) {
    if (pinnedOrder.includes(k)) pinned.push([k, v]);
    else rest.push([k, v]);
  }
  const ordered = Object.fromEntries([
    ...pinned.sort((a, b) => pinnedOrder.indexOf(a[0]) - pinnedOrder.indexOf(b[0])),
    ...rest.sort((a, b) => a[0].localeCompare(b[0])),
  ]);

  // gray-matter preserves object key insertion order when serializing
  const out = matter.stringify(content ?? '', ordered, { delimiters: '---' });
  // Ensure single trailing newline
  return out.replace(/\s*$/u, '\n');
}



