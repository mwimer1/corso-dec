-- Migration: Add deep_research_usage table for tracking Deep Research feature usage
-- Created: 2026-01-03
-- Purpose: Track monthly Deep Research usage per user for pricing tier limits

-- Create deep_research_usage table
CREATE TABLE IF NOT EXISTS public.deep_research_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  usage_month DATE NOT NULL, -- First day of month (YYYY-MM-01)
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT deep_research_usage_user_month_unique UNIQUE(user_id, usage_month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deep_research_usage_user_month 
  ON public.deep_research_usage(user_id, usage_month);

CREATE INDEX IF NOT EXISTS idx_deep_research_usage_org_month 
  ON public.deep_research_usage(org_id, usage_month);

CREATE INDEX IF NOT EXISTS idx_deep_research_usage_month 
  ON public.deep_research_usage(usage_month);

-- Enable Row Level Security
ALTER TABLE public.deep_research_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own usage records
CREATE POLICY "Users can view their own deep research usage"
  ON public.deep_research_usage FOR SELECT
  USING (auth.uid()::text = user_id);

-- RLS Policy: Service role can manage all records (for server-side operations)
CREATE POLICY "Service role can manage all deep research usage"
  ON public.deep_research_usage FOR ALL
  USING (auth.role() = 'service_role');

-- Function to increment usage count (idempotent)
CREATE OR REPLACE FUNCTION public.increment_deep_research_usage(
  p_user_id TEXT,
  p_org_id TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month DATE;
  v_usage_count INTEGER;
BEGIN
  -- Get first day of current month
  v_current_month := DATE_TRUNC('month', NOW())::DATE;
  
  -- Upsert: increment usage count or create new record
  INSERT INTO public.deep_research_usage (user_id, org_id, usage_month, usage_count, last_used_at, updated_at)
  VALUES (p_user_id, p_org_id, v_current_month, 1, NOW(), NOW())
  ON CONFLICT (user_id, usage_month)
  DO UPDATE SET
    usage_count = deep_research_usage.usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW();
  
  -- Return current usage count
  SELECT usage_count INTO v_usage_count
  FROM public.deep_research_usage
  WHERE user_id = p_user_id AND usage_month = v_current_month;
  
  RETURN v_usage_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.increment_deep_research_usage(TEXT, TEXT) TO service_role;

-- Function to get current month usage count
CREATE OR REPLACE FUNCTION public.get_deep_research_usage(
  p_user_id TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month DATE;
  v_usage_count INTEGER;
BEGIN
  -- Get first day of current month
  v_current_month := DATE_TRUNC('month', NOW())::DATE;
  
  -- Get usage count for current month
  SELECT COALESCE(usage_count, 0) INTO v_usage_count
  FROM public.deep_research_usage
  WHERE user_id = p_user_id AND usage_month = v_current_month;
  
  RETURN COALESCE(v_usage_count, 0);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_deep_research_usage(TEXT) TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.deep_research_usage IS 'Tracks monthly Deep Research feature usage per user for pricing tier limits';
COMMENT ON COLUMN public.deep_research_usage.usage_month IS 'First day of the month (YYYY-MM-01) for monthly tracking';
COMMENT ON COLUMN public.deep_research_usage.usage_count IS 'Number of Deep Research requests used in this month';
COMMENT ON FUNCTION public.increment_deep_research_usage IS 'Increments usage count for current month (idempotent upsert)';
COMMENT ON FUNCTION public.get_deep_research_usage IS 'Returns current month usage count for a user';
