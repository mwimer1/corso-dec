-- 20251214151700_add_tenant_composite_indexes.sql
-- Workstream D: Indexing improvements for tenant-filtered queries
-- This migration adds composite indexes optimized for common query patterns
-- that filter by tenant (org_id or user_id) combined with other columns.

-- ═══════════════════════════════════════════════════════════════════════════
-- USER-SCOPED TABLES: Composite indexes for user_id + common filters/ordering
-- ═══════════════════════════════════════════════════════════════════════════

-- saved_views: (user_id, created_at DESC) for listing views by user, ordered by date
DO $$
BEGIN
  IF to_regclass('public.saved_views') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'saved_views' 
       AND indexname = 'idx_saved_views_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_saved_views_user_created_at ON public.saved_views(user_id, created_at DESC)';
  END IF;
END $$;

-- saved_views: (user_id, view_type) for filtering by type per user
DO $$
BEGIN
  IF to_regclass('public.saved_views') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'saved_views' 
       AND indexname = 'idx_saved_views_user_type'
     ) THEN
    EXECUTE 'CREATE INDEX idx_saved_views_user_type ON public.saved_views(user_id, view_type)';
  END IF;
END $$;

-- watchlists: (user_id, created_at DESC) for listing watchlists by user, ordered by date
DO $$
BEGIN
  IF to_regclass('public.watchlists') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'watchlists' 
       AND indexname = 'idx_watchlists_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_watchlists_user_created_at ON public.watchlists(user_id, created_at DESC)';
  END IF;
END $$;

-- watchlist_items: (watchlist_id, created_at DESC) for listing items in a watchlist, ordered by date
DO $$
BEGIN
  IF to_regclass('public.watchlist_items') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'watchlist_items' 
       AND indexname = 'idx_watchlist_items_watchlist_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_watchlist_items_watchlist_created_at ON public.watchlist_items(watchlist_id, created_at DESC)';
  END IF;
END $$;

-- saved_files: (user_id, created_at DESC) for listing files by user, ordered by date
DO $$
BEGIN
  IF to_regclass('public.saved_files') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'saved_files' 
       AND indexname = 'idx_saved_files_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_saved_files_user_created_at ON public.saved_files(user_id, created_at DESC)';
  END IF;
END $$;

-- saved_files: (user_id, file_type) for filtering by file type per user
DO $$
BEGIN
  IF to_regclass('public.saved_files') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'saved_files' 
       AND indexname = 'idx_saved_files_user_type'
     ) THEN
    EXECUTE 'CREATE INDEX idx_saved_files_user_type ON public.saved_files(user_id, file_type)';
  END IF;
END $$;

-- saved_searches: (user_id, name) for name lookups (complements existing created_at index)
DO $$
BEGIN
  IF to_regclass('public.saved_searches') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'saved_searches' 
       AND indexname = 'idx_saved_searches_user_name'
     ) THEN
    EXECUTE 'CREATE INDEX idx_saved_searches_user_name ON public.saved_searches(user_id, name)';
  END IF;
END $$;

-- payment_history: (user_id, created_at DESC) for listing payment history ordered by date
DO $$
BEGIN
  IF to_regclass('public.payment_history') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'payment_history' 
       AND indexname = 'idx_payment_history_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_payment_history_user_created_at ON public.payment_history(user_id, created_at DESC)';
  END IF;
END $$;

-- api_keys: (user_id, created_at DESC) for listing API keys by user, ordered by date
DO $$
BEGIN
  IF to_regclass('public.api_keys') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'api_keys' 
       AND indexname = 'idx_api_keys_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_api_keys_user_created_at ON public.api_keys(user_id, created_at DESC)';
  END IF;
END $$;

-- user_data: (user_id, created_at DESC) if created_at column exists
DO $$
BEGIN
  IF to_regclass('public.user_data') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'user_data' 
       AND column_name = 'created_at'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'user_data' 
       AND indexname = 'idx_user_data_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_user_data_user_created_at ON public.user_data(user_id, created_at DESC)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ORG-SCOPED TABLES: Composite indexes for org_id + common filters/ordering
-- ═══════════════════════════════════════════════════════════════════════════

-- checkout_sessions: (user_id, expires_at) for finding active sessions
DO $$
BEGIN
  IF to_regclass('public.checkout_sessions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'checkout_sessions' 
       AND indexname = 'idx_checkout_sessions_user_expires_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_checkout_sessions_user_expires_at ON public.checkout_sessions(user_id, expires_at DESC)';
  END IF;
END $$;

-- checkout_sessions: (org_id, created_at DESC) for listing sessions by org, ordered by date
DO $$
BEGIN
  IF to_regclass('public.checkout_sessions') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'checkout_sessions' 
       AND column_name = 'org_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'checkout_sessions' 
       AND indexname = 'idx_checkout_sessions_org_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_checkout_sessions_org_created_at ON public.checkout_sessions(org_id, created_at DESC)';
  END IF;
END $$;

-- subscriptions: (org_id, created_at DESC) for listing subscriptions by org, ordered by date
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'subscriptions' 
       AND column_name = 'org_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'subscriptions' 
       AND indexname = 'idx_subscriptions_org_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_subscriptions_org_created_at ON public.subscriptions(org_id, created_at DESC)';
  END IF;
END $$;

-- subscriptions: (user_id, created_at DESC) if user_id filtering is common
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'subscriptions' 
       AND column_name = 'user_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'subscriptions' 
       AND indexname = 'idx_subscriptions_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_subscriptions_user_created_at ON public.subscriptions(user_id, created_at DESC)';
  END IF;
END $$;

-- org_subscriptions: (org_id, created_at DESC) for listing org subscriptions, ordered by date
DO $$
BEGIN
  IF to_regclass('public.org_subscriptions') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'org_subscriptions' 
       AND column_name = 'created_at'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'org_subscriptions' 
       AND indexname = 'idx_org_subscriptions_org_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_org_subscriptions_org_created_at ON public.org_subscriptions(org_id, created_at DESC)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- CHAT MESSAGES: Additional indexes for session-based queries
-- ═══════════════════════════════════════════════════════════════════════════

-- chat_messages: (session_id, created_at DESC) for listing messages in a session, ordered by date
DO $$
BEGIN
  IF to_regclass('public.chat_messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'chat_messages' 
       AND indexname = 'idx_chat_messages_session_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_chat_messages_session_created_at ON public.chat_messages(session_id, created_at DESC)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- AUDIT LOG: Indexes for audit queries
-- ═══════════════════════════════════════════════════════════════════════════

-- audit_log: (user_id, created_at DESC) for listing audit entries by user, ordered by date
DO $$
BEGIN
  IF to_regclass('public.audit_log') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'audit_log' 
       AND column_name = 'user_id'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'audit_log' 
       AND column_name = 'created_at'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'audit_log' 
       AND indexname = 'idx_audit_log_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_audit_log_user_created_at ON public.audit_log(user_id, created_at DESC)';
  END IF;
END $$;

-- audit_log: (table_name, record_id) for looking up audit entries for specific records
DO $$
BEGIN
  IF to_regclass('public.audit_log') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'audit_log' 
       AND column_name = 'table_name'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'audit_log' 
       AND column_name = 'record_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes 
       WHERE schemaname = 'public' 
       AND tablename = 'audit_log' 
       AND indexname = 'idx_audit_log_table_record'
     ) THEN
    EXECUTE 'CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id)';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON INDEX IF EXISTS idx_saved_views_user_created_at IS 'Optimizes queries listing saved views by user, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_saved_views_user_type IS 'Optimizes queries filtering saved views by type per user';
COMMENT ON INDEX IF EXISTS idx_watchlists_user_created_at IS 'Optimizes queries listing watchlists by user, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_watchlist_items_watchlist_created_at IS 'Optimizes queries listing items in a watchlist, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_saved_files_user_created_at IS 'Optimizes queries listing saved files by user, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_saved_files_user_type IS 'Optimizes queries filtering saved files by type per user';
COMMENT ON INDEX IF EXISTS idx_saved_searches_user_name IS 'Optimizes queries looking up saved searches by name per user';
COMMENT ON INDEX IF EXISTS idx_payment_history_user_created_at IS 'Optimizes queries listing payment history by user, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_api_keys_user_created_at IS 'Optimizes queries listing API keys by user, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_checkout_sessions_user_expires_at IS 'Optimizes queries finding active checkout sessions by user';
COMMENT ON INDEX IF EXISTS idx_checkout_sessions_org_created_at IS 'Optimizes queries listing checkout sessions by org, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_subscriptions_org_created_at IS 'Optimizes queries listing subscriptions by org, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_subscriptions_user_created_at IS 'Optimizes queries listing subscriptions by user, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_chat_messages_session_created_at IS 'Optimizes queries listing messages in a session, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_audit_log_user_created_at IS 'Optimizes queries listing audit entries by user, ordered by creation date';
COMMENT ON INDEX IF EXISTS idx_audit_log_table_record IS 'Optimizes queries looking up audit entries for specific records';

