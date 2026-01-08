-- 20251214153000_query_performance_monitoring.sql
-- Workstream G: Performance monitoring foundations
-- This migration creates tables and functions for tracking database query performance

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. QUERY PERFORMANCE METRICS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Table to track query performance metrics
CREATE TABLE IF NOT EXISTS public.query_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT,
  query_type TEXT,
  table_name TEXT,
  execution_time_ms INTEGER NOT NULL,
  row_count INTEGER,
  user_id UUID,
  org_id TEXT,
  is_slow BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_query_performance_created_at 
  ON public.query_performance_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_slow_queries 
  ON public.query_performance_metrics(created_at DESC, is_slow) 
  WHERE is_slow = true;

CREATE INDEX IF NOT EXISTS idx_query_performance_table_name 
  ON public.query_performance_metrics(table_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_operation 
  ON public.query_performance_metrics(operation, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_org_id 
  ON public.query_performance_metrics(org_id, created_at DESC);

-- Enable RLS (service role only)
ALTER TABLE public.query_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Service role can manage performance metrics
CREATE POLICY "Service role can manage performance metrics"
  ON public.query_performance_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FUNCTION TO LOG QUERY PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to insert query performance metrics
CREATE OR REPLACE FUNCTION public.log_query_performance(
  p_operation TEXT,
  p_query_type TEXT,
  p_table_name TEXT,
  p_execution_time_ms INTEGER,
  p_row_count INTEGER DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_org_id TEXT DEFAULT NULL,
  p_is_slow BOOLEAN DEFAULT false,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.query_performance_metrics (
    operation,
    query_type,
    table_name,
    execution_time_ms,
    row_count,
    user_id,
    org_id,
    is_slow,
    error_message
  )
  VALUES (
    p_operation,
    p_query_type,
    p_table_name,
    p_execution_time_ms,
    p_row_count,
    p_user_id,
    p_org_id,
    p_is_slow,
    p_error_message
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. PERFORMANCE STATISTICS FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to get performance statistics for a time window
CREATE OR REPLACE FUNCTION public.get_query_performance_stats(
  p_time_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  total_queries BIGINT,
  slow_queries BIGINT,
  avg_execution_time_ms NUMERIC,
  p95_execution_time_ms NUMERIC,
  p99_execution_time_ms NUMERIC,
  error_count BIGINT,
  error_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_queries,
    COUNT(*) FILTER (WHERE is_slow = true)::BIGINT AS slow_queries,
    AVG(execution_time_ms)::NUMERIC AS avg_execution_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms)::NUMERIC AS p95_execution_time_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms)::NUMERIC AS p99_execution_time_ms,
    COUNT(*) FILTER (WHERE error_message IS NOT NULL)::BIGINT AS error_count,
    CASE
      WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE error_message IS NOT NULL)::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0
    END AS error_rate
  FROM public.query_performance_metrics
  WHERE created_at >= NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
END;
$$;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION public.get_slow_queries(
  p_limit INTEGER DEFAULT 100,
  p_time_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  id UUID,
  operation TEXT,
  query_type TEXT,
  table_name TEXT,
  execution_time_ms INTEGER,
  row_count INTEGER,
  user_id UUID,
  org_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.operation,
    q.query_type,
    q.table_name,
    q.execution_time_ms,
    q.row_count,
    q.user_id,
    q.org_id,
    q.error_message,
    q.created_at
  FROM public.query_performance_metrics q
  WHERE q.is_slow = true
    AND q.created_at >= NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
  ORDER BY q.execution_time_ms DESC, q.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to get performance stats by table
CREATE OR REPLACE FUNCTION public.get_table_performance_stats(
  p_time_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  table_name TEXT,
  total_queries BIGINT,
  slow_queries BIGINT,
  avg_execution_time_ms NUMERIC,
  p95_execution_time_ms NUMERIC,
  p99_execution_time_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.table_name,
    COUNT(*)::BIGINT AS total_queries,
    COUNT(*) FILTER (WHERE q.is_slow = true)::BIGINT AS slow_queries,
    AVG(q.execution_time_ms)::NUMERIC AS avg_execution_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY q.execution_time_ms)::NUMERIC AS p95_execution_time_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY q.execution_time_ms)::NUMERIC AS p99_execution_time_ms
  FROM public.query_performance_metrics q
  WHERE q.created_at >= NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
    AND q.table_name IS NOT NULL
  GROUP BY q.table_name
  ORDER BY avg_execution_time_ms DESC;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RETENTION POLICY
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to clean up old performance metrics (retention: 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_performance_metrics(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.query_performance_metrics
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.log_query_performance(TEXT, TEXT, TEXT, INTEGER, INTEGER, UUID, TEXT, BOOLEAN, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_query_performance_stats(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_slow_queries(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_table_performance_stats(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_performance_metrics(INTEGER) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.query_performance_metrics IS 'Tracks query performance metrics for monitoring and optimization';
COMMENT ON FUNCTION public.log_query_performance IS 'Logs query performance metrics';
COMMENT ON FUNCTION public.get_query_performance_stats IS 'Returns aggregate performance statistics for a time window';
COMMENT ON FUNCTION public.get_slow_queries IS 'Returns slow queries within a time window';
COMMENT ON FUNCTION public.get_table_performance_stats IS 'Returns performance statistics grouped by table';
COMMENT ON FUNCTION public.cleanup_old_performance_metrics IS 'Cleans up old performance metrics based on retention policy';

