import type { UseCaseKey } from '@/lib/marketing/client';

export interface Industry {
  key: UseCaseKey;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  impact: string;
  impactMetrics?: string[];
  previewImageSrc?: string;
  previewImageAlt?: string;
  previewImage?: { src: string; alt: string };
}

