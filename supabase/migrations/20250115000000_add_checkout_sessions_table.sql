-- Migration: Add checkout_sessions table for Stripe checkout idempotency
-- Created: 2025-01-15
-- Purpose: Track checkout sessions to prevent duplicate Stripe checkout creation

-- Create checkout_sessions table
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
    id TEXT PRIMARY KEY, -- Idempotency key
    user_id TEXT NOT NULL,
    price_id TEXT NOT NULL,
    org_id TEXT NULL,
    checkout_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Indexes for performance
    CONSTRAINT checkout_sessions_user_id_idx UNIQUE (user_id, price_id, org_id, created_at),
    INDEX idx_checkout_sessions_user_price ON public.checkout_sessions (user_id, price_id),
    INDEX idx_checkout_sessions_created_at ON public.checkout_sessions (created_at),
    INDEX idx_checkout_sessions_expires_at ON public.checkout_sessions (expires_at)
);

-- Enable Row Level Security
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own checkout sessions"
    ON public.checkout_sessions FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all checkout sessions"
    ON public.checkout_sessions FOR ALL
    USING (auth.role() = 'service_role');

-- Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_checkout_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.checkout_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_checkout_sessions() TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.checkout_sessions IS 'Stores checkout session information for idempotency in Stripe checkout creation';
COMMENT ON COLUMN public.checkout_sessions.id IS 'Idempotency key in format: [userId]-[priceId]-[orgId?]-[timestamp]';
COMMENT ON COLUMN public.checkout_sessions.checkout_url IS 'Stripe checkout session URL';
COMMENT ON COLUMN public.checkout_sessions.expires_at IS 'When this checkout session expires (24 hours from creation)';
COMMENT ON FUNCTION cleanup_expired_checkout_sessions() IS 'Removes expired checkout sessions to prevent table bloat'; 