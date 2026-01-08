-- 20250813120000_add_missing_tenant_indexes.sql
-- Purpose: Add indexes on tenant and frequently filtered columns to improve query performance.
-- Notes:
-- - Wrapped in DO blocks to safely skip when tables/columns are absent in certain environments.
-- - Avoids CONCURRENTLY to remain compatible with transactional migration runners.

/* user_preferences(user_id) */
DO $$
BEGIN
  IF to_regclass('public.user_preferences') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_user_preferences_user_id'
     ) THEN
    EXECUTE 'CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id)';
  END IF;
END $$;

/* chat_messages(user_id, created_at) for ordered history fetches */
DO $$
BEGIN
  IF to_regclass('public.chat_messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_chat_messages_user_created_at'
     ) THEN
    EXECUTE 'CREATE INDEX idx_chat_messages_user_created_at ON public.chat_messages(user_id, created_at DESC)';
  END IF;
END $$;

/* org_subscriptions(org_id) */
DO $$
BEGIN
  IF to_regclass('public.org_subscriptions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_org_subscriptions_org_id'
     ) THEN
    EXECUTE 'CREATE INDEX idx_org_subscriptions_org_id ON public.org_subscriptions(org_id)';
  END IF;
END $$;

/* subscriptions(org_id) */
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'org_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_subscriptions_org_id'
     ) THEN
    EXECUTE 'CREATE INDEX idx_subscriptions_org_id ON public.subscriptions(org_id)';
  END IF;
END $$;

/* subscriptions(clerk_id) used in Stripe cache invalidation */
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'clerk_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_subscriptions_clerk_id'
     ) THEN
    EXECUTE 'CREATE INDEX idx_subscriptions_clerk_id ON public.subscriptions(clerk_id)';
  END IF;
END $$;

/* Optional: checkout_sessions(user_id) safeguard (if table exists) */
DO $$
BEGIN
  IF to_regclass('public.checkout_sessions') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'checkout_sessions' AND column_name = 'user_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_checkout_sessions_user_id'
     ) THEN
    EXECUTE 'CREATE INDEX idx_checkout_sessions_user_id ON public.checkout_sessions(user_id)';
  END IF;
END $$;


