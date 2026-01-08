-- Migration: Make org_id optional in deep_research_usage table (support personal-scope users)
-- Created: 2026-01-04
-- Purpose: Allow usage tracking for personal users without organizations

-- 1. Make org_id nullable
ALTER TABLE public.deep_research_usage 
  ALTER COLUMN org_id DROP NOT NULL;

-- 2. Update unique constraint to handle null org_id
-- Drop existing constraint if it exists
ALTER TABLE public.deep_research_usage 
  DROP CONSTRAINT IF EXISTS deep_research_usage_user_month_unique;

-- Create unique constraint that includes org_id
-- Postgres unique constraints allow multiple NULLs, but we want one NULL per user/month
-- So we use a partial unique index for personal users (org_id IS NULL)
-- And a regular unique constraint for org users (org_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS deep_research_usage_user_month_personal_unique 
  ON public.deep_research_usage(user_id, usage_month) 
  WHERE org_id IS NULL;

-- For org-scoped rows, use unique constraint on (user_id, org_id, usage_month)
-- Postgres allows this - multiple NULLs are distinct, but non-NULL values must be unique
CREATE UNIQUE INDEX IF NOT EXISTS deep_research_usage_user_org_month_unique 
  ON public.deep_research_usage(user_id, org_id, usage_month) 
  WHERE org_id IS NOT NULL;

-- 3. Update RPC function to accept nullable org_id
CREATE OR REPLACE FUNCTION public.increment_deep_research_usage(
  p_user_id TEXT,
  p_org_id TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_month DATE;
  v_usage_count INTEGER;
  v_org_id TEXT := NULLIF(p_org_id, '');
BEGIN
  -- Get first day of current month
  v_current_month := DATE_TRUNC('month', NOW())::DATE;
  
  -- Upsert: increment usage count or create new record
  -- Handle both org-scoped and personal-scope rows
  -- Normalize empty string to NULL for consistency
  IF v_org_id IS NULL THEN
    -- Personal user: use partial unique index (user_id, usage_month) WHERE org_id IS NULL
    INSERT INTO public.deep_research_usage (user_id, org_id, usage_month, usage_count, last_used_at, updated_at)
    VALUES (p_user_id, NULL, v_current_month, 1, NOW(), NOW())
    ON CONFLICT (user_id, usage_month) WHERE org_id IS NULL
    DO UPDATE SET
      usage_count = deep_research_usage.usage_count + 1,
      last_used_at = NOW(),
      updated_at = NOW();
  ELSE
    -- Org user: use unique index (user_id, org_id, usage_month) WHERE org_id IS NOT NULL
    INSERT INTO public.deep_research_usage (user_id, org_id, usage_month, usage_count, last_used_at, updated_at)
    VALUES (p_user_id, v_org_id, v_current_month, 1, NOW(), NOW())
    ON CONFLICT (user_id, org_id, usage_month) WHERE org_id IS NOT NULL
    DO UPDATE SET
      usage_count = deep_research_usage.usage_count + 1,
      last_used_at = NOW(),
      updated_at = NOW();
  END IF;
  
  -- Return current usage count
  SELECT usage_count INTO v_usage_count
  FROM public.deep_research_usage
  WHERE user_id = p_user_id 
    AND usage_month = v_current_month
    AND (v_org_id IS NULL AND org_id IS NULL OR org_id = v_org_id);
  
  RETURN COALESCE(v_usage_count, 0);
END;
$$;

-- 4. Update get_deep_research_usage to handle personal users (org_id can be null)
-- The existing function already works (it only filters by user_id), but update comment
COMMENT ON FUNCTION public.get_deep_research_usage IS 'Returns current month usage count for a user (supports both org-scoped and personal-scope users)';

-- 5. Update RLS policies (already support personal users - they filter by user_id only)
-- No changes needed - existing policies already allow users to view their own records
-- regardless of org_id value

-- Add comments for documentation
COMMENT ON COLUMN public.deep_research_usage.org_id IS 'Organization ID (nullable for personal-scope users)';
COMMENT ON FUNCTION public.increment_deep_research_usage IS 'Increments usage count for current month (supports both org-scoped and personal-scope users)';
