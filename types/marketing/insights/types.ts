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
  /** Last updated date (optional, defaults to publishDate if not provided) */
  updatedDate?: ISODateString;
  imageUrl?: string;
  categories?: Array<{ slug: string; name: string }>;
  /** Estimated reading time in minutes */
  readingTime?: number;
  /** Author information (optional for previews) */
  author?: { name: string; avatar?: string };
}

/**
 * Full marketing insight with article content and (optional) author.
 */
export interface InsightItem extends InsightPreview {
  content: string;
  /** Author information (more commonly present in full items) */
  author?: { name: string; avatar?: string };
}

