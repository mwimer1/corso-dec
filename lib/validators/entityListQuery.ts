import { z } from 'zod';

// Accepted entity route params
export const EntityParamSchema = z.enum(['projects', 'companies', 'addresses']);
export type EntityParam = z.infer<typeof EntityParamSchema>;

// Sort direction
export const SortDirSchema = z.enum(['asc', 'desc']);
export type SortDir = z.infer<typeof SortDirSchema>;

// Query params for list endpoints
export const EntityListQuerySchema = z.object({
  page: z.coerce.number().int().nonnegative().default(0),
  pageSize: z.coerce.number().int().positive().max(500).default(50),
  sortBy: z.string().trim().optional().default(''),
  sortDir: SortDirSchema.optional().default('asc'),
  search: z.string().optional().default(''),
  // filters can be a JSON string or a record
  // TODO: Implement proper filter validation
  filters: z.any().optional(),
}).strict();

export type EntityListQuery = z.infer<typeof EntityListQuerySchema>;

