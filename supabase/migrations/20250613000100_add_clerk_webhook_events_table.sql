-- 20250613000100_add_clerk_webhook_events_table.sql
-- Add clerk_webhook_events table for webhook idempotency

create table if not exists public.clerk_webhook_events (
  id text primary key,
  processed_at timestamp with time zone default now() not null
);

-- Add a unique index on id (redundant with PK, but explicit for clarity)
create unique index if not exists clerk_webhook_events_id_idx on public.clerk_webhook_events (id); 