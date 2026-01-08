import type { LucideIcon } from 'lucide-react';

export type PreviewTab = 'dashboard' | 'sample' | 'outputs';

export interface UseCasePreview {
  headline: string;
  highlights: string[];
  kpis: { label: string; value: string }[];
  sampleRecord: { label: string; value: string }[];
}

export interface UseCase {
  id: string;
  title: string;
  oneLiner: string;
  pain: string;
  howCorsoHelps: string;
  outputs: string[];
  icon: LucideIcon;
  preview: UseCasePreview;
}

export interface Industry {
  id: string;
  label: string;
  tagline: string;
  helperLine: string;
  quickProof: string[];
  useCases: UseCase[];
}

