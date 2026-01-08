import { z } from 'zod';

// Define the schema locally for type inference (not exported since it's unused)
const zUseCase = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  benefits: z.array(z.string().min(1)).min(1).max(6),
  impact: z.string().min(1),
}).strict();

export type UseCaseKey = 'insurance' | 'suppliers' | 'construction' | 'developers';
export type UseCase = z.infer<typeof zUseCase>;

export const zUseCaseMap = z.record(z.enum(['insurance','suppliers','construction','developers']), zUseCase);

