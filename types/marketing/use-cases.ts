import { z } from 'zod';

// Preview image schema for structured preview data
const zPreviewImage = z.object({
  src: z.string().url(),
  alt: z.string().min(1),
}).strict();

// Define the schema locally for type inference (not exported since it's unused)
const zUseCase = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  benefits: z.array(z.string().min(1)).min(1).max(6),
  impact: z.string().min(1),
  // Structured impact metrics (replaces fragile string parsing)
  impactMetrics: z.array(z.string().min(1)).max(3).optional(),
  // Legacy preview image fields (deprecated, use previewImage instead)
  previewImageSrc: z.string().url().optional(),
  previewImageAlt: z.string().min(1).optional(),
  // Structured preview image object (preferred)
  previewImage: zPreviewImage.optional(),
}).strict();

export type UseCaseKey = 'insurance' | 'suppliers' | 'construction' | 'developers';
export type UseCase = z.infer<typeof zUseCase>;

export const zUseCaseMap = z.record(z.enum(['insurance','suppliers','construction','developers']), zUseCase);
