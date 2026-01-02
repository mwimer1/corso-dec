// components/insights/utils/image-resolver.ts
// Shared image resolver for insights - ensures consistent image URLs across list, detail, metadata, and related articles.
// Safe to import from both server and client components (no Node.js-only APIs).

type InsightLike = {
  imageUrl?: string;
  categories?: Array<{ slug: string }>;
};

const GENERIC_PLACEHOLDER_SUBSTRING = "projects-interface";

const pexels = (id: number, w = 1200, h = 675) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

// Category-aware placeholder thumbnails (remote Pexels CDN).
// NOTE: Keys must match real category slugs used in content.
export const categoryPlaceholderImageMap: Record<string, string> = {
  technology: pexels(8470810),
  "market-analysis": pexels(19915446),
  sustainability: pexels(27863809),
  "cost-management": pexels(5915147),
  safety: pexels(10739750),
  data: pexels(4508751),
  general: pexels(1188532),
  default: pexels(20847810),
};

/**
 * Resolves the image URL for an insight, applying consistent logic:
 * 1. Use real cover image if it exists and isn't the generic placeholder
 * 2. Use category-based placeholder if category exists
 * 3. Fall back to default placeholder
 */
export function resolveInsightImageUrl(insight: InsightLike): string {
  const imageUrl = insight.imageUrl;
  const isGeneric =
    typeof imageUrl === "string" && imageUrl.includes(GENERIC_PLACEHOLDER_SUBSTRING);

  // 1) Use real cover image if it exists and isn't the generic placeholder
  if (imageUrl && !isGeneric) return imageUrl;

  // 2) Category-based placeholder
  const primaryCategory = insight.categories?.[0]?.slug;
  if (primaryCategory && categoryPlaceholderImageMap[primaryCategory]) {
    return categoryPlaceholderImageMap[primaryCategory]!;
  }

  // 3) Default placeholder (always exists)
  return categoryPlaceholderImageMap['default']!;
}
