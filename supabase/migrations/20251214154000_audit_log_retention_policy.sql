-- 20251214154000_audit_log_retention_policy.sql
-- Workstream H: Audit log growth & retention policy
-- This migration creates retention policies, cleanup functions, and growth monitoring for audit logs

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. AUDIT LOG RETENTION CONFIGURATION TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Table to track audit log retention configuration
CREATE TABLE IF NOT EXISTS public.audit_log_retention_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retention_days INTEGER NOT NULL DEFAULT 90, -- Default: 90 days
  archive_before_delete BOOLEAN DEFAULT false, -- Archive before deletion
  archive_location TEXT, -- Archive storage location (if archiving enabled)
  cleanup_schedule TEXT DEFAULT 'daily', -- Cleanup schedule: daily, weekly, monthly
  last_cleanup_at TIMESTAMPTZ,
  last_cleanup_deleted_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_log_retention_config_single_row CHECK (id = (SELECT id FROM public.audit_log_retention_config LIMIT 1))
);

-- Insert default configuration if not exists
INSERT INTO public.audit_log_retention_config (id, retention_days, archive_before_delete, cleanup_schedule)
VALUES (gen_random_uuid(), 90, false, 'daily')
ON CONFLICT DO NOTHING;

-- Enable RLS (service role only)
ALTER TABLE public.audit_log_retention_config ENABLE ROW LEVEL SECURITY;

-- Service role can manage retention config
CREATE POLICY "Service role can manage retention config"
  ON public.audit_log_retention_config FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. AUDIT LOG STATISTICS FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION public.get_audit_log_stats()
RETURNS TABLE(
  total_entries BIGINT,
  entries_older_than_retention BIGINT,
  oldest_entry TIMESTAMPTZ,
  newest_entry TIMESTAMPTZ,
  entries_by_table JSONB,
  entries_by_operation JSONB,
  estimated_size_mb NUMERIC,
  retention_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days INTEGER;
  v_retention_date TIMESTAMPTZ;
BEGIN
  -- Get retention configuration
  SELECT retention_days INTO v_retention_days
  FROM public.audit_log_retention_config
  LIMIT 1;
  
  v_retention_days := COALESCE(v_retention_days, 90);
  v_retention_date := NOW() - (v_retention_days || ' days')::INTERVAL;
  
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_entries,
    COUNT(*) FILTER (WHERE changed_at < v_retention_date)::BIGINT AS entries_older_than_retention,
    MIN(changed_at) AS oldest_entry,
    MAX(changed_at) AS newest_entry,
    (
      SELECT jsonb_object_agg(table_name, count)
      FROM (
        SELECT table_name, COUNT(*)::BIGINT as count
        FROM public.audit_log
        GROUP BY table_name
      ) t
    ) AS entries_by_table,
    (
      SELECT jsonb_object_agg(op, count)
      FROM (
        SELECT op, COUNT(*)::BIGINT as count
        FROM public.audit_log
        GROUP BY op
      ) o
    ) AS entries_by_operation,
    -- Estimate size: UUID (16 bytes) + table_name (avg 20 bytes) + record_id (16 bytes) + user_id (16 bytes) + op (10 bytes) + changed_at (8 bytes) + overhead (20 bytes) = ~106 bytes per row
    (COUNT(*) * 106 / 1024.0 / 1024.0)::NUMERIC(10, 2) AS estimated_size_mb,
    v_retention_days AS retention_days
  FROM public.audit_log;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. AUDIT LOG CLEANUP FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to clean up old audit log entries
CREATE OR REPLACE FUNCTION public.cleanup_audit_log(
  p_retention_days INTEGER DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT false
)
RETURNS TABLE(
  deleted_count INTEGER,
  retention_days_used INTEGER,
  cutoff_date TIMESTAMPTZ,
  dry_run BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retention_days INTEGER;
  v_cutoff_date TIMESTAMPTZ;
  v_deleted_count INTEGER;
  v_config_id UUID;
BEGIN
  -- Get retention configuration
  SELECT id, retention_days INTO v_config_id, v_retention_days
  FROM public.audit_log_retention_config
  LIMIT 1;
  
  -- Use provided retention days or config default
  v_retention_days := COALESCE(p_retention_days, v_retention_days, 90);
  v_cutoff_date := NOW() - (v_retention_days || ' days')::INTERVAL;
  
  IF p_dry_run THEN
    -- Count entries that would be deleted
    SELECT COUNT(*)::INTEGER INTO v_deleted_count
    FROM public.audit_log
    WHERE changed_at < v_cutoff_date;
  ELSE
    -- Delete old entries
    DELETE FROM public.audit_log
    WHERE changed_at < v_cutoff_date;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Update retention config with cleanup info
    IF v_config_id IS NOT NULL THEN
      UPDATE public.audit_log_retention_config
      SET
        last_cleanup_at = NOW(),
        last_cleanup_deleted_count = v_deleted_count,
        updated_at = NOW()
      WHERE id = v_config_id;
    END IF;
  END IF;
  
  RETURN QUERY
  SELECT
    v_deleted_count AS deleted_count,
    v_retention_days AS retention_days_used,
    v_cutoff_date AS cutoff_date,
    p_dry_run AS dry_run;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. AUDIT LOG ARCHIVE FUNCTION (Optional)
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to archive audit log entries before deletion
-- Note: This is a placeholder for future archive implementation
CREATE OR REPLACE FUNCTION public.archive_audit_log(
  p_cutoff_date TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  -- TODO: Implement archive logic (e.g., export to S3, external storage, etc.)
  -- For now, this is a placeholder that returns 0
  -- Future implementation could:
  -- 1. Export to CSV/JSON
  -- 2. Upload to S3 or similar storage
  -- 3. Store in separate archive table
  -- 4. Compress and store externally
  
  v_archived_count := 0;
  
  RETURN v_archived_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. AUDIT LOG GROWTH MONITORING FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to monitor audit log growth rate
CREATE OR REPLACE FUNCTION public.get_audit_log_growth_rate(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  period_days INTEGER,
  entries_added BIGINT,
  entries_per_day NUMERIC,
  estimated_growth_per_month BIGINT,
  current_total BIGINT,
  projected_size_mb_in_30_days NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_entries_added BIGINT;
  v_current_total BIGINT;
  v_entries_per_day NUMERIC;
BEGIN
  v_start_date := NOW() - (p_days || ' days')::INTERVAL;
  
  -- Count entries added in the period
  SELECT COUNT(*)::BIGINT INTO v_entries_added
  FROM public.audit_log
  WHERE changed_at >= v_start_date;
  
  -- Count current total
  SELECT COUNT(*)::BIGINT INTO v_current_total
  FROM public.audit_log;
  
  -- Calculate entries per day
  v_entries_per_day := CASE
    WHEN p_days > 0 THEN v_entries_added::NUMERIC / p_days
    ELSE 0
  END;
  
  RETURN QUERY
  SELECT
    p_days AS period_days,
    v_entries_added AS entries_added,
    v_entries_per_day AS entries_per_day,
    (v_entries_per_day * 30)::BIGINT AS estimated_growth_per_month,
    v_current_total AS current_total,
    ((v_current_total + (v_entries_per_day * 30)) * 106 / 1024.0 / 1024.0)::NUMERIC(10, 2) AS projected_size_mb_in_30_days;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. UPDATE RETENTION CONFIGURATION FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to update retention configuration
CREATE OR REPLACE FUNCTION public.update_audit_log_retention(
  p_retention_days INTEGER,
  p_archive_before_delete BOOLEAN DEFAULT NULL,
  p_cleanup_schedule TEXT DEFAULT NULL
)
RETURNS TABLE(
  retention_days INTEGER,
  archive_before_delete BOOLEAN,
  cleanup_schedule TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config_id UUID;
BEGIN
  -- Get or create config
  SELECT id INTO v_config_id
  FROM public.audit_log_retention_config
  LIMIT 1;
  
  IF v_config_id IS NULL THEN
    INSERT INTO public.audit_log_retention_config (
      retention_days,
      archive_before_delete,
      cleanup_schedule
    )
    VALUES (
      p_retention_days,
      COALESCE(p_archive_before_delete, false),
      COALESCE(p_cleanup_schedule, 'daily')
    )
    RETURNING id INTO v_config_id;
  ELSE
    UPDATE public.audit_log_retention_config
    SET
      retention_days = p_retention_days,
      archive_before_delete = COALESCE(p_archive_before_delete, archive_before_delete),
      cleanup_schedule = COALESCE(p_cleanup_schedule, cleanup_schedule),
      updated_at = NOW()
    WHERE id = v_config_id;
  END IF;
  
  RETURN QUERY
  SELECT
    retention_days,
    archive_before_delete,
    cleanup_schedule,
    updated_at
  FROM public.audit_log_retention_config
  WHERE id = v_config_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.get_audit_log_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_audit_log(INTEGER, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.archive_audit_log(TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_audit_log_growth_rate(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_audit_log_retention(INTEGER, BOOLEAN, TEXT) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.audit_log_retention_config IS 'Configuration for audit log retention policy';
COMMENT ON FUNCTION public.get_audit_log_stats() IS 'Returns comprehensive statistics about audit log entries';
COMMENT ON FUNCTION public.cleanup_audit_log(INTEGER, BOOLEAN) IS 'Cleans up old audit log entries based on retention policy';
COMMENT ON FUNCTION public.archive_audit_log(TIMESTAMPTZ) IS 'Archives audit log entries before deletion (placeholder for future implementation)';
COMMENT ON FUNCTION public.get_audit_log_growth_rate(INTEGER) IS 'Monitors audit log growth rate and projects future size';
COMMENT ON FUNCTION public.update_audit_log_retention(INTEGER, BOOLEAN, TEXT) IS 'Updates audit log retention configuration';

