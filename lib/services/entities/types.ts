import { z } from 'zod';

export const TableColumnFormatEnum = z.enum([
  'text','number','currency','date','datetime','badge','link'
]);

export const TableColumnConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),          // or use i18nKey below
  i18nKey: z.string().optional(),    // e.g. 'entity.projects.columns.name'
  accessor: z.string().min(1),       // dot-path into row object (serializable)
  sortable: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  width: z.number().int().positive().optional(),
  minWidth: z.number().int().positive().optional(),
  flex: z.number().int().positive().optional(),
  format: TableColumnFormatEnum.optional(),
  a11y: z.object({
    headerAriaLabel: z.string().optional()
  }).optional()
}).strict();

export type TableColumnConfig = z.infer<typeof TableColumnConfigSchema>;
