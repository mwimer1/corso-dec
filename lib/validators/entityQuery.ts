import { z } from 'zod';

/**
 * Entity query request body schema (POST /api/v1/entity/{entity}/query)
 * Matches OpenAPI spec format
 */
export const EntityQueryRequestSchema = z.object({
  filter: z.record(z.unknown()).optional(),
  sort: z.array(
    z.object({
      field: z.string(),
      dir: z.enum(['asc', 'desc']),
    })
  ).optional(),
  page: z.object({
    index: z.number().int().nonnegative(),
    size: z.number().int().positive().max(1000),
  }),
}).strict();

export type EntityQueryRequest = z.infer<typeof EntityQueryRequestSchema>;

