import { categorySlugify, getAllInsights, getCategories } from "@/lib/marketing/server";
import { getEnv } from "@/lib/server/env";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getEnv().NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

  // Core marketing pages
  const entries = [
    { url: `${base}/`, changefreq: 'daily', priority: 1.0 },
    { url: `${base}/pricing`, changefreq: 'weekly', priority: 0.8 },
    { url: `${base}/contact`, changefreq: 'monthly', priority: 0.6 },
    { url: `${base}/insights`, changefreq: 'weekly', priority: 0.7 },
  ];

  // Add individual insight article pages from content service (fallback handled inside)
  const insights = await getAllInsights();
  for (const item of insights) {
    if (item.slug) {
      entries.push({
        url: `${base}/insights/${item.slug}`,
        changefreq: 'monthly',
        priority: 0.5,
      });
    }
  }

  // Add category listing pages
  const categories = await getCategories();
  for (const cat of categories) {
    const slug = cat.slug || categorySlugify(cat.name);
    entries.push({
      url: `${base}/insights/categories/${slug}`,
      changefreq: 'weekly',
      priority: 0.6,
    });
  }

  return entries;
}



