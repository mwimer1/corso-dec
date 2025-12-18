'use client';

import { InsightCard } from '@/components/insights/insight-card';
import { cn } from '@/styles';
import { ArrowRight } from 'lucide-react';
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
    <section 
      className={cn("space-y-6 sm:space-y-8", className)} 
      aria-labelledby="related-articles-heading"
    >
      <header className="space-y-2">
        <h2 
          id="related-articles-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
        >
          Related Articles
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Continue exploring insights and industry trends
        </p>
      </header>
      
      <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
      
      <div className="pt-6 sm:pt-8 text-center border-t border-border">
        <Link 
          href="/insights" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label="View all insights articles"
        >
          View all insights
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default RelatedArticles;
