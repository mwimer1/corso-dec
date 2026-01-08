import { z } from 'zod';

// Accepted entity route params
export const EntityParamSchema = z.enum(['projects', 'companies', 'addresses']);
export type EntityParam = z.infer<typeof EntityParamSchema>;

// Sort direction
export const SortDirSchema = z.enum(['asc', 'desc']);
export type SortDir = z.infer<typeof SortDirSchema>;

/**
 * Valid filter operations for entity queries
 * Matches EntityFilterOp from lib/entities/validation.ts
 */
export const FilterOpSchema = z.enum([
  'eq',
  'contains',
  'gt',
  'lt',
  'gte',
  'lte',
  'in',
  'between',
  'bool',
]);
export type FilterOp = z.infer<typeof FilterOpSchema>;

/**
 * Maximum number of filters allowed per request
 */
const MAX_FILTERS = 25;

/**
 * Maximum length for filter field names
 */
const MAX_FIELD_LENGTH = 100;

/**
 * Maximum length for string filter values
 */
const MAX_VALUE_STRING_LENGTH = 1000;

/**
 * Strict filter value schema that validates based on operator type
 */
const FilterValueSchema: z.ZodType<unknown> = z.union([
  z.string().max(MAX_VALUE_STRING_LENGTH),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string().max(MAX_VALUE_STRING_LENGTH), z.number()])),
  z.tuple([z.union([z.string(), z.number()]), z.union([z.string(), z.number()])]),
]);

/**
 * Individual filter object schema
 */
const FilterItemSchema = z
  .object({
    field: z.string().trim().min(1).max(MAX_FIELD_LENGTH),
    op: FilterOpSchema,
    value: FilterValueSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      // 'in' operator requires array value
      if (data.op === 'in') {
        return Array.isArray(data.value) && data.value.length > 0;
      }
      // 'between' operator requires tuple of length 2
      if (data.op === 'between') {
        return (
          Array.isArray(data.value) &&
          data.value.length === 2 &&
          (typeof data.value[0] === 'string' || typeof data.value[0] === 'number') &&
          (typeof data.value[1] === 'string' || typeof data.value[1] === 'number')
        );
      }
      // 'bool' operator requires boolean value
      if (data.op === 'bool') {
        return typeof data.value === 'boolean';
      }
      // Other operators (eq, contains, gt, lt, gte, lte) can have string, number, or undefined value
      return (
        data.value === undefined ||
        typeof data.value === 'string' ||
        typeof data.value === 'number'
      );
    },
    {
      message: 'Filter value does not match operator requirements',
    }
  );

/**
 * Filter array schema with max length constraint
 */
const FilterArraySchema = z
  .array(FilterItemSchema)
  .max(MAX_FILTERS, { message: `Maximum ${MAX_FILTERS} filters allowed` })
  .optional();

/**
 * Schema for filters query parameter
 * Accepts string (JSON), transforms to array, and validates structure
 */
const FiltersParamSchema = z
  .union([
    z.string().transform((val, ctx) => {
      // Handle empty string as undefined
      if (!val || val.trim() === '') {
        return undefined;
      }

      // Try to decode URI component first, then parse JSON
      let parsed: unknown;
      try {
        const decoded = decodeURIComponent(val);
        parsed = JSON.parse(decoded);
      } catch {
        try {
          parsed = JSON.parse(val);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid filters format: must be valid JSON',
          });
          return z.NEVER;
        }
      }

      // Must be an array
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid filters format: must be a JSON array',
        });
        return z.NEVER;
      }

      return parsed;
    }),
    z.array(FilterItemSchema),
    z.undefined(),
  ])
  .pipe(FilterArraySchema);

// Query params for list endpoints
export const EntityListQuerySchema = z.object({
  page: z.coerce.number().int().nonnegative().default(0),
  pageSize: z.coerce.number().int().positive().max(500).default(50),
  sortBy: z.string().trim().optional().default(''),
  sortDir: SortDirSchema.optional().default('asc'),
  search: z.string().optional().default(''),
  filters: FiltersParamSchema,
}).strict();

export type EntityListQuery = z.infer<typeof EntityListQuerySchema>;

