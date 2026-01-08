'use client';

import { InsightCard } from '@/components/insights/insight-card';
import Link from 'next/link';

interface RelatedArticlesProps {
  articles: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    imageUrl?: string;
    categories?: Array<{ name: string }>;
    publishDate?: string;
    author?: { name: string; slug: string };
    readingTime?: number;
  }>;
  className?: string;
}

export function RelatedArticles({ articles, className }: RelatedArticlesProps) {
  if (!articles.length) return null;

  return (
    <section className={className}>
      <h2 className="text-xl font-semibold mb-6">Related Articles</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(0, 3).map((article) => (
          <InsightCard
            key={article.slug}
            href={`/insights/${article.slug}`}
            title={article.title}
            excerpt={article.excerpt || undefined}
            image={article.imageUrl ? { src: article.imageUrl as string, alt: article.title } : undefined}
            category={article.categories?.[0]?.name || undefined}
            date={article.publishDate || undefined}
            readingTime={article.readingTime ? `${article.readingTime} min read` : undefined}
            author={article.author ? {
              name: article.author.name as string
            } : undefined}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link href="/insights" className="text-primary hover:underline">
          View all insights →
        </Link>
      </div>
    </section>
  );
}

export default RelatedArticles;
