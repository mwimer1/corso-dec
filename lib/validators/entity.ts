import { z } from 'zod';

/**
 * Entity parameter validation schema
 * @public
 */
export const EntityParamSchema = z.object({ entity: z.enum(['projects','addresses','companies']) }).strict();

// Note: EntityParam type export removed - consumers can use z.infer<typeof EntityParamSchema> when needed



