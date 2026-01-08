import { z } from 'zod';

/**
 * Helpers
 */
const toStringOrUndef = (v: unknown) => (v == null ? undefined : String(v));
const toTrimmedOrUndef = (v: unknown) => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};
const toNumberOrUndef = (v: unknown) => {
  if (v == null) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[,$\s\$]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const toISODateOrNull = (v: unknown) => {
  if (v == null || v === '') return null;
  const s = typeof v === 'string' ? v.trim() : String(v);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

/**
 * Raw row coming from mock JSON fixtures (loose, coercive via preprocess)
 * @public
 * Note: Used indirectly through @/lib/validators/testing barrel
 */
export const RawProjectRow = z.object({
  building_permit_id: z.preprocess(toTrimmedOrUndef, z.string().optional()),
  project_name: z.preprocess(toTrimmedOrUndef, z.string().optional()),
  job_value: z.preprocess(toNumberOrUndef, z.number().optional()),
  effective_date: z.preprocess(toStringOrUndef, z.string().optional()),
  latitude: z.preprocess(toNumberOrUndef, z.number().optional()),
  longitude: z.preprocess(toNumberOrUndef, z.number().optional()),
  status: z.preprocess(toTrimmedOrUndef, z.string().optional()),
}).strict();

/**
 * Canonical record consumed by TanStack — stable types.
 * Prefer explicit nulls for optional numeric/date fields to keep shape stable.
 * @public
 * Note: Used indirectly through @/lib/validators/testing barrel
 */
export const CanonicalProject = z.object({
  building_permit_id: z.string(),
  project_name: z.string().nullable(),
  job_value: z.number().nullable(),
  effective_date: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  status: z.string().nullable(),
}).strict();

/**
 * @public
 */
export const CanonicalProjectsFile = z.array(CanonicalProject);

/**
 * @public
 */
export type TRawProjectRow = z.infer<typeof RawProjectRow>;
/**
 * @public
 */
export type TCanonicalProject = z.infer<typeof CanonicalProject>;

// small helper exported for adapter convenience
/**
 * @public
 * Note: Used indirectly through @/lib/validators/testing barrel
 */
export function toISODateOrNullExport(v: unknown): string | null {
  return toISODateOrNull(v);
}



