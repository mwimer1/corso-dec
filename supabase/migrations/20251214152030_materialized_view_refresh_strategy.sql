-- 20251214152030_materialized_view_refresh_strategy.sql
-- Workstream E: Materialized view refresh strategy
-- This migration creates a comprehensive refresh strategy for materialized views
-- including status tracking, enhanced refresh functions, and health monitoring.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. REFRESH STATUS TRACKING TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Table to track materialized view refresh status and history
CREATE TABLE IF NOT EXISTS public.mv_refresh_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matview_name TEXT NOT NULL,
  last_refresh_started_at TIMESTAMPTZ,
  last_refresh_completed_at TIMESTAMPTZ,
  last_refresh_duration_ms INTEGER,
  last_refresh_status TEXT CHECK (last_refresh_status IN ('success', 'failed', 'in_progress')),
  last_refresh_error TEXT,
  refresh_count BIGINT DEFAULT 0,
  next_scheduled_refresh_at TIMESTAMPTZ,
  refresh_frequency_minutes INTEGER DEFAULT 60, -- Default: hourly
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mv_refresh_status_matview_name_unique UNIQUE (matview_name)
);

-- Index for querying refresh status
CREATE INDEX IF NOT EXISTS idx_mv_refresh_status_matview_name 
  ON public.mv_refresh_status(matview_name);

CREATE INDEX IF NOT EXISTS idx_mv_refresh_status_next_refresh 
  ON public.mv_refresh_status(next_scheduled_refresh_at) 
  WHERE next_scheduled_refresh_at IS NOT NULL;

-- Enable RLS (service role only)
ALTER TABLE public.mv_refresh_status ENABLE ROW LEVEL SECURITY;

-- Service role can manage refresh status
CREATE POLICY "Service role can manage refresh status"
  ON public.mv_refresh_status FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ENHANCED REFRESH FUNCTIONS WITH STATUS TRACKING
-- ═══════════════════════════════════════════════════════════════════════════

-- Generic function to refresh any materialized view with status tracking
CREATE OR REPLACE FUNCTION public.refresh_materialized_view(
  p_matview_name TEXT,
  p_concurrent BOOLEAN DEFAULT true
)
RETURNS TABLE(
  success BOOLEAN,
  duration_ms INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration_ms INTEGER;
  v_error_message TEXT;
  v_success BOOLEAN := false;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Update status to in_progress
  INSERT INTO public.mv_refresh_status (
    matview_name,
    last_refresh_started_at,
    last_refresh_status,
    updated_at
  )
  VALUES (
    p_matview_name,
    v_start_time,
    'in_progress',
    NOW()
  )
  ON CONFLICT (matview_name) DO UPDATE SET
    last_refresh_started_at = v_start_time,
    last_refresh_status = 'in_progress',
    updated_at = NOW();

  BEGIN
    -- Perform the refresh
    IF p_concurrent THEN
      EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', p_matview_name);
    ELSE
      EXECUTE format('REFRESH MATERIALIZED VIEW %I', p_matview_name);
    END IF;
    
    v_success := true;
    v_end_time := clock_timestamp();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INTEGER * 1000;
    
    -- Update status to success
    UPDATE public.mv_refresh_status
    SET
      last_refresh_completed_at = v_end_time,
      last_refresh_duration_ms = v_duration_ms,
      last_refresh_status = 'success',
      last_refresh_error = NULL,
      refresh_count = refresh_count + 1,
      next_scheduled_refresh_at = v_end_time + (refresh_frequency_minutes || ' minutes')::INTERVAL,
      updated_at = NOW()
    WHERE matview_name = p_matview_name;
    
  EXCEPTION WHEN OTHERS THEN
    v_success := false;
    v_end_time := clock_timestamp();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INTEGER * 1000;
    v_error_message := SQLERRM;
    
    -- Update status to failed
    UPDATE public.mv_refresh_status
    SET
      last_refresh_completed_at = v_end_time,
      last_refresh_duration_ms = v_duration_ms,
      last_refresh_status = 'failed',
      last_refresh_error = v_error_message,
      updated_at = NOW()
    WHERE matview_name = p_matview_name;
  END;
  
  RETURN QUERY SELECT v_success, v_duration_ms, v_error_message;
END;
$$;

-- Enhanced refresh function for mv_projects_daily_counts
CREATE OR REPLACE FUNCTION public.refresh_mv_projects_daily_counts()
RETURNS TABLE(
  success BOOLEAN,
  duration_ms INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if materialized view exists
  IF to_regclass('public.mv_projects_daily_counts') IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Materialized view mv_projects_daily_counts does not exist'::TEXT;
    RETURN;
  END IF;
  
  -- Use generic refresh function with concurrent refresh
  RETURN QUERY
  SELECT * FROM public.refresh_materialized_view('mv_projects_daily_counts', true);
END;
$$;

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
RETURNS TABLE(
  matview_name TEXT,
  success BOOLEAN,
  duration_ms INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_matview RECORD;
BEGIN
  -- Loop through all materialized views in public schema
  FOR v_matview IN
    SELECT matviewname
    FROM pg_matviews
    WHERE schemaname = 'public'
  LOOP
    RETURN QUERY
    SELECT 
      v_matview.matviewname::TEXT,
      r.success,
      r.duration_ms,
      r.error_message
    FROM public.refresh_materialized_view(v_matview.matviewname, true) r;
  END LOOP;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. HEALTH CHECK AND MONITORING FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to check refresh health status
CREATE OR REPLACE FUNCTION public.check_mv_refresh_health()
RETURNS TABLE(
  matview_name TEXT,
  is_healthy BOOLEAN,
  last_refresh_at TIMESTAMPTZ,
  last_refresh_status TEXT,
  refresh_age_minutes INTEGER,
  next_refresh_due_at TIMESTAMPTZ,
  is_overdue BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.matview_name,
    CASE
      WHEN s.last_refresh_status = 'success' 
        AND (s.next_scheduled_refresh_at IS NULL OR s.next_scheduled_refresh_at > NOW())
        AND s.last_refresh_completed_at > NOW() - INTERVAL '24 hours'
      THEN true
      ELSE false
    END AS is_healthy,
    s.last_refresh_completed_at AS last_refresh_at,
    s.last_refresh_status,
    CASE
      WHEN s.last_refresh_completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (NOW() - s.last_refresh_completed_at))::INTEGER / 60
      ELSE NULL
    END AS refresh_age_minutes,
    s.next_scheduled_refresh_at AS next_refresh_due_at,
    CASE
      WHEN s.next_scheduled_refresh_at IS NOT NULL AND s.next_scheduled_refresh_at < NOW()
      THEN true
      ELSE false
    END AS is_overdue,
    s.last_refresh_error AS error_message
  FROM public.mv_refresh_status s
  ORDER BY s.matview_name;
END;
$$;

-- Function to get refresh statistics
CREATE OR REPLACE FUNCTION public.get_mv_refresh_stats()
RETURNS TABLE(
  matview_name TEXT,
  total_refreshes BIGINT,
  avg_duration_ms NUMERIC,
  last_refresh_at TIMESTAMPTZ,
  last_refresh_status TEXT,
  refresh_frequency_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.matview_name,
    s.refresh_count,
    CASE
      WHEN s.refresh_count > 0
      THEN (
        SELECT AVG(last_refresh_duration_ms)
        FROM public.mv_refresh_status
        WHERE matview_name = s.matview_name
        AND last_refresh_duration_ms IS NOT NULL
      )
      ELSE NULL
    END AS avg_duration_ms,
    s.last_refresh_completed_at AS last_refresh_at,
    s.last_refresh_status,
    s.refresh_frequency_minutes
  FROM public.mv_refresh_status s
  ORDER BY s.matview_name;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. INITIALIZE REFRESH STATUS FOR EXISTING MATERIALIZED VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Initialize refresh status for mv_projects_daily_counts if it exists
DO $$
BEGIN
  IF to_regclass('public.mv_projects_daily_counts') IS NOT NULL THEN
    INSERT INTO public.mv_refresh_status (
      matview_name,
      refresh_frequency_minutes,
      next_scheduled_refresh_at
    )
    VALUES (
      'mv_projects_daily_counts',
      60, -- Refresh hourly
      NOW() + INTERVAL '1 hour'
    )
    ON CONFLICT (matview_name) DO NOTHING;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. AUTOMATIC STATUS INITIALIZATION TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to automatically initialize refresh status for new materialized views
CREATE OR REPLACE FUNCTION public.auto_init_mv_refresh_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize refresh status for new materialized views
  INSERT INTO public.mv_refresh_status (
    matview_name,
    refresh_frequency_minutes,
    next_scheduled_refresh_at
  )
  VALUES (
    NEW.matviewname,
    60, -- Default: hourly refresh
    NOW() + INTERVAL '1 hour'
  )
  ON CONFLICT (matview_name) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Note: PostgreSQL doesn't support triggers on CREATE MATERIALIZED VIEW events
-- This function should be called manually after creating new materialized views
-- or we can use event triggers (requires superuser, not available in Supabase)

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.refresh_materialized_view(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_mv_projects_daily_counts() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_all_materialized_views() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_mv_refresh_health() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_mv_refresh_stats() TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.mv_refresh_status IS 'Tracks refresh status and history for all materialized views';
COMMENT ON FUNCTION public.refresh_materialized_view(TEXT, BOOLEAN) IS 'Generic function to refresh any materialized view with status tracking';
COMMENT ON FUNCTION public.refresh_mv_projects_daily_counts() IS 'Enhanced refresh function for mv_projects_daily_counts with status tracking';
COMMENT ON FUNCTION public.refresh_all_materialized_views() IS 'Refreshes all materialized views in the public schema';
COMMENT ON FUNCTION public.check_mv_refresh_health() IS 'Health check function to monitor materialized view refresh status';
COMMENT ON FUNCTION public.get_mv_refresh_stats() IS 'Returns refresh statistics for all materialized views';

