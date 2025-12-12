// Centralized types for Insights components
export type InsightCardProps = {
  href: string;
  title: string;
  excerpt?: string | undefined;
  image?: { src: string; alt?: string; width?: number; height?: number } | undefined;
  category?: string | undefined;
  author?: { name: string; href?: string | undefined } | undefined;
  date?: string | undefined; // ISO
  readingTime?: string | undefined;
  variant?: 'standard' | 'overlay';
};

export type Category = { key: string; label: string; count?: number };

export type CategoryFilterProps = {
  categories: Category[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
  stickyOffsetClassName?: string;
};

