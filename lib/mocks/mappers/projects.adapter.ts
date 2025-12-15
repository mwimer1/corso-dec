/**
 * Adapts vendor/aggregated CSV project rows into the canonical "ProjectsFile" row shape
 * expected by the dashboard and Zod file schema.
 *
 * We keep Zod schemas .strict() and do all widening/narrowing here.
 */
import type { TRawProjectRow } from '@/lib/validators/mock-projects';
import {
    CanonicalProject,
    CanonicalProjectsFile,
    RawProjectRow,
    toISODateOrNullExport,
} from '@/lib/validators/mock-projects';
import { isProduction } from '@/lib/shared/config/client';
import type { z } from 'zod';

// RawProjectCsvRow schema and type removed as unused



/**
 * Map one raw CSV row (unknown/dirty) → canonical project row consumed by ProjectsFile.
 * This keeps the validator strict while making the data source flexible.
 */
export function adaptProjectsFile(rawFile: unknown): z.infer<typeof CanonicalProjectsFile> {
  // Validate input is array
  if (!Array.isArray(rawFile)) return [];

  function adaptRow(raw: unknown): z.infer<typeof CanonicalProject> | null {
    // First, coerce/validate raw shape using new RawProjectRow
    const parsed = RawProjectRow.safeParse(raw as TRawProjectRow);
    if (!parsed.success) {
      if (!isProduction()) {
        console.warn('[mock-projects] Skipping row — raw validation failed', parsed.error.issues, { raw });
      }
      return null;
    }

    const r = parsed.data as TRawProjectRow;

    const candidate = {
      building_permit_id: (r.building_permit_id ?? '').trim(),
      project_name: r.project_name ?? null,
      job_value: r.job_value ?? null,
      effective_date: r.effective_date ? toISODateOrNullExport(r.effective_date) : null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      status: r.status ?? null,
    };

    const canon = CanonicalProject.safeParse(candidate);
    if (!canon.success || !candidate.building_permit_id) {
      if (!isProduction()) {
        console.warn('[mock-projects] Skipping row — canonical validation failed', canon.success ? 'missing id' : canon.error.issues, { candidate });
      }
      return null;
    }
    return canon.data;
  }

  const mapped = rawFile.map(adaptRow).filter((x): x is z.infer<typeof CanonicalProject> => Boolean(x));

  // Final file-level validation
  const final = CanonicalProjectsFile.safeParse(mapped);
  if (!final.success) {
    if (!isProduction()) {
      console.warn('[mock-projects] CanonicalProjectsFile validation failed — returning best-effort subset', final.error.issues);
    }
    return mapped.filter((it) => CanonicalProject.safeParse(it).success);
  }
  return final.data;
}



