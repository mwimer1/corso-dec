-- 20251214151602_add_missing_constraints.sql
-- Workstream C: Add missing foreign keys, unique constraints, CHECK constraints
-- This migration adds data integrity constraints to ensure referential integrity
-- and prevent invalid data states.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. FOREIGN KEYS
-- ═══════════════════════════════════════════════════════════════════════════

-- chat_messages: Add foreign key to auth.users
-- Note: user_id is UUID, so we can add a proper foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chat_messages_user_id_fkey'
    AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. UNIQUE CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════

-- saved_views: Prevent duplicate names per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_views_user_name_unique'
    AND conrelid = 'public.saved_views'::regclass
  ) THEN
    ALTER TABLE public.saved_views
    ADD CONSTRAINT saved_views_user_name_unique
    UNIQUE (user_id, name);
  END IF;
END $$;

-- watchlists: Prevent duplicate names per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watchlists_user_name_unique'
    AND conrelid = 'public.watchlists'::regclass
  ) THEN
    ALTER TABLE public.watchlists
    ADD CONSTRAINT watchlists_user_name_unique
    UNIQUE (user_id, name);
  END IF;
END $$;

-- watchlist_items: Prevent duplicate entities in the same watchlist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watchlist_items_unique_entity'
    AND conrelid = 'public.watchlist_items'::regclass
  ) THEN
    ALTER TABLE public.watchlist_items
    ADD CONSTRAINT watchlist_items_unique_entity
    UNIQUE (watchlist_id, entity_type, entity_id);
  END IF;
END $$;

-- saved_files: Prevent duplicate file paths per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_files_user_path_unique'
    AND conrelid = 'public.saved_files'::regclass
  ) THEN
    ALTER TABLE public.saved_files
    ADD CONSTRAINT saved_files_user_path_unique
    UNIQUE (user_id, file_path);
  END IF;
END $$;

-- saved_searches: Prevent duplicate names per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_searches_user_name_unique'
    AND conrelid = 'public.saved_searches'::regclass
  ) THEN
    ALTER TABLE public.saved_searches
    ADD CONSTRAINT saved_searches_user_name_unique
    UNIQUE (user_id, name);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CHECK CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════

-- checkout_sessions: Ensure expires_at is after created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'checkout_sessions_expires_after_created'
    AND conrelid = 'public.checkout_sessions'::regclass
  ) THEN
    ALTER TABLE public.checkout_sessions
    ADD CONSTRAINT checkout_sessions_expires_after_created
    CHECK (expires_at > created_at);
  END IF;
END $$;

-- checkout_sessions: Ensure checkout_url is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'checkout_sessions_url_not_empty'
    AND conrelid = 'public.checkout_sessions'::regclass
  ) THEN
    ALTER TABLE public.checkout_sessions
    ADD CONSTRAINT checkout_sessions_url_not_empty
    CHECK (length(trim(checkout_url)) > 0);
  END IF;
END $$;

-- saved_views: Ensure name is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_views_name_not_empty'
    AND conrelid = 'public.saved_views'::regclass
  ) THEN
    ALTER TABLE public.saved_views
    ADD CONSTRAINT saved_views_name_not_empty
    CHECK (length(trim(name)) > 0);
  END IF;
END $$;

-- saved_views: Ensure view_type is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_views_type_not_empty'
    AND conrelid = 'public.saved_views'::regclass
  ) THEN
    ALTER TABLE public.saved_views
    ADD CONSTRAINT saved_views_type_not_empty
    CHECK (length(trim(view_type)) > 0);
  END IF;
END $$;

-- watchlists: Ensure name is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watchlists_name_not_empty'
    AND conrelid = 'public.watchlists'::regclass
  ) THEN
    ALTER TABLE public.watchlists
    ADD CONSTRAINT watchlists_name_not_empty
    CHECK (length(trim(name)) > 0);
  END IF;
END $$;

-- watchlist_items: Ensure entity_type is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watchlist_items_entity_type_not_empty'
    AND conrelid = 'public.watchlist_items'::regclass
  ) THEN
    ALTER TABLE public.watchlist_items
    ADD CONSTRAINT watchlist_items_entity_type_not_empty
    CHECK (length(trim(entity_type)) > 0);
  END IF;
END $$;

-- watchlist_items: Ensure entity_id is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watchlist_items_entity_id_not_empty'
    AND conrelid = 'public.watchlist_items'::regclass
  ) THEN
    ALTER TABLE public.watchlist_items
    ADD CONSTRAINT watchlist_items_entity_id_not_empty
    CHECK (length(trim(entity_id)) > 0);
  END IF;
END $$;

-- saved_files: Ensure name is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_files_name_not_empty'
    AND conrelid = 'public.saved_files'::regclass
  ) THEN
    ALTER TABLE public.saved_files
    ADD CONSTRAINT saved_files_name_not_empty
    CHECK (length(trim(name)) > 0);
  END IF;
END $$;

-- saved_files: Ensure file_type is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_files_file_type_not_empty'
    AND conrelid = 'public.saved_files'::regclass
  ) THEN
    ALTER TABLE public.saved_files
    ADD CONSTRAINT saved_files_file_type_not_empty
    CHECK (length(trim(file_type)) > 0);
  END IF;
END $$;

-- saved_files: Ensure file_path is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_files_file_path_not_empty'
    AND conrelid = 'public.saved_files'::regclass
  ) THEN
    ALTER TABLE public.saved_files
    ADD CONSTRAINT saved_files_file_path_not_empty
    CHECK (length(trim(file_path)) > 0);
  END IF;
END $$;

-- chat_messages: Ensure content is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chat_messages_content_not_empty'
    AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages
    ADD CONSTRAINT chat_messages_content_not_empty
    CHECK (length(trim(content)) > 0);
  END IF;
END $$;

-- payment_history: Ensure amount is non-negative (if present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_history_amount_non_negative'
    AND conrelid = 'public.payment_history'::regclass
  ) THEN
    ALTER TABLE public.payment_history
    ADD CONSTRAINT payment_history_amount_non_negative
    CHECK (amount IS NULL OR amount >= 0);
  END IF;
END $$;

-- api_keys: Ensure key is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'api_keys_key_not_empty'
    AND conrelid = 'public.api_keys'::regclass
  ) THEN
    ALTER TABLE public.api_keys
    ADD CONSTRAINT api_keys_key_not_empty
    CHECK (length(trim(key)) > 0);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON CONSTRAINT chat_messages_user_id_fkey ON public.chat_messages IS 'Foreign key to auth.users ensuring referential integrity';
COMMENT ON CONSTRAINT saved_views_user_name_unique ON public.saved_views IS 'Prevents duplicate view names per user';
COMMENT ON CONSTRAINT watchlists_user_name_unique ON public.watchlists IS 'Prevents duplicate watchlist names per user';
COMMENT ON CONSTRAINT watchlist_items_unique_entity ON public.watchlist_items IS 'Prevents duplicate entities in the same watchlist';
COMMENT ON CONSTRAINT saved_files_user_path_unique ON public.saved_files IS 'Prevents duplicate file paths per user';
COMMENT ON CONSTRAINT saved_searches_user_name_unique ON public.saved_searches IS 'Prevents duplicate search names per user';
COMMENT ON CONSTRAINT checkout_sessions_expires_after_created ON public.checkout_sessions IS 'Ensures expiration is after creation time';

