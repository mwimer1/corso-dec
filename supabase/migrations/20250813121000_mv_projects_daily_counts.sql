-- 20250813121000_mv_projects_daily_counts.sql
-- Purpose: Pre-aggregate daily project counts per org and status to offload frequent analytics.

-- Create materialized view only if base table exists
DO $$
BEGIN
  IF to_regclass('public.projects') IS NOT NULL THEN
    -- Create MV when it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_projects_daily_counts'
    ) THEN
      EXECUTE $$
        CREATE MATERIALIZED VIEW public.mv_projects_daily_counts AS
        SELECT
          org_id,
          date_trunc('day', created_at)::date AS day,
          status,
          count(*)::bigint AS project_count
        FROM public.projects
        GROUP BY org_id, day, status
      $$;
    END IF;

    -- Ensure supporting unique index (required for CONCURRENT refresh)
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ux_mv_projects_daily_counts_org_day_status'
    ) THEN
      EXECUTE 'CREATE UNIQUE INDEX ux_mv_projects_daily_counts_org_day_status ON public.mv_projects_daily_counts(org_id, day, status)';
    END IF;
  END IF;
END $$;

-- Provide a helper function to refresh the MV concurrently
CREATE OR REPLACE FUNCTION public.refresh_mv_projects_daily_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF to_regclass('public.mv_projects_daily_counts') IS NOT NULL THEN
    PERFORM 1;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_projects_daily_counts;
  END IF;
END;
$$;


