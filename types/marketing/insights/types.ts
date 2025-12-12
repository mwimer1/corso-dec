// Import and re-export canonical ISODateString from shared types
import type { ISODateString } from '@/types/shared';

/**
 * Marketing insight preview for cards and listings.
 */
export interface InsightPreview {
  id: string;
  slug: string;
  title: string;
  description?: string;
  publishDate?: ISODateString;
  imageUrl?: string;
  categories?: Array<{ slug: string; name: string }>;
  /** Estimated reading time in minutes */
  readingTime?: number;
}

/**
 * Full marketing insight with article content and (optional) author.
 */
export interface InsightItem extends InsightPreview {
  content: string;
  author?: { name: string; avatar?: string };
}

