-- ═════════════════════════════════════════════════════════════════════
-- add_saved_views_and_watchlists.sql
-- Requires   : pgcrypto (for gen_random_uuid)
-- Depends on : auth.users (id uuid)
-- ═════════════════════════════════════════════════════════════════════

-- 0 ▸ extension (makes gen_random_uuid available) ---------------------
create extension if not exists "pgcrypto";

-- 1 ▸ helper to auto-update updated_at --------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 2 ▸  Tables
-- ─────────────────────────────────────────────────────────────────────

/* ---------- saved_views ---------- */
create table if not exists public.saved_views (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid     not null references auth.users(id) on delete cascade,
  name        text     not null,
  view_type   text     not null,
  view_config jsonb    not null,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

/* ---------- watchlists ---------- */
create table if not exists public.watchlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid  not null references auth.users(id) on delete cascade,
  name        text  not null,
  description text,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

/* ---------- watchlist_items ---------- */
create table if not exists public.watchlist_items (
  id           uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  entity_type  text not null,
  entity_id    text not null,
  notes        text,
  created_at   timestamptz not null default timezone('utc', now())
);

/* ---------- saved_files ---------- */
create table if not exists public.saved_files (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid  not null references auth.users(id) on delete cascade,
  name        text  not null,
  file_type   text  not null,
  file_path   text  not null,
  metadata    jsonb,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

-- 3 ▸ triggers for updated_at ----------------------------------------
create or replace trigger trg_saved_views_touch_updated_at
before update on public.saved_views
for each row execute function public.touch_updated_at();

create or replace trigger trg_watchlists_touch_updated_at
before update on public.watchlists
for each row execute function public.touch_updated_at();

create or replace trigger trg_saved_files_touch_updated_at
before update on public.saved_files
for each row execute function public.touch_updated_at();

-- 4 ▸ indexes ---------------------------------------------------------
create index if not exists idx_saved_views_user_id
    on public.saved_views(user_id);

create index if not exists idx_watchlists_user_id
    on public.watchlists(user_id);

create index if not exists idx_watchlist_items_watchlist_id
    on public.watchlist_items(watchlist_id);

create index if not exists idx_saved_files_user_id
    on public.saved_files(user_id);

-- (optional) prevent duplicate entities in one list
-- create unique index if not exists idx_watchlist_items_unique_entity
--   on public.watchlist_items(watchlist_id, entity_type, entity_id);

-- 5 ▸ RLS -------------------------------------------------------------
alter table public.saved_views      enable row level security;
alter table public.watchlists       enable row level security;
alter table public.watchlist_items  enable row level security;
alter table public.saved_files      enable row level security;

/* saved_views - idempotent policies */
drop policy if exists "sv_select_owner" on public.saved_views;
drop policy if exists "sv_ins_owner" on public.saved_views;
drop policy if exists "sv_upd_owner" on public.saved_views;
drop policy if exists "sv_del_owner" on public.saved_views;

create policy "sv_select_owner"
  on public.saved_views for select
  using ( auth.uid() = user_id );

create policy "sv_ins_owner"
  on public.saved_views for insert
  with check ( auth.uid() = user_id );

create policy "sv_upd_owner"
  on public.saved_views for update
  using ( auth.uid() = user_id );

create policy "sv_del_owner"
  on public.saved_views for delete
  using ( auth.uid() = user_id );

/* watchlists - idempotent policies */
drop policy if exists "wl_select_owner" on public.watchlists;
drop policy if exists "wl_ins_owner" on public.watchlists;
drop policy if exists "wl_upd_owner" on public.watchlists;
drop policy if exists "wl_del_owner" on public.watchlists;

create policy "wl_select_owner"
  on public.watchlists for select
  using ( auth.uid() = user_id );

create policy "wl_ins_owner"
  on public.watchlists for insert
  with check ( auth.uid() = user_id );

create policy "wl_upd_owner"
  on public.watchlists for update
  using ( auth.uid() = user_id );

create policy "wl_del_owner"
  on public.watchlists for delete
  using ( auth.uid() = user_id );

/* watchlist_items - idempotent policies */
drop policy if exists "wli_select_owner" on public.watchlist_items;
drop policy if exists "wli_ins_owner" on public.watchlist_items;
drop policy if exists "wli_upd_owner" on public.watchlist_items;
drop policy if exists "wli_del_owner" on public.watchlist_items;

create policy "wli_select_owner"
  on public.watchlist_items for select
  using (
    exists (
      select 1
      from public.watchlists
      where watchlists.id = watchlist_items.watchlist_id
        and watchlists.user_id = auth.uid()
    )
  );

create policy "wli_ins_owner"
  on public.watchlist_items for insert
  with check (
    exists (
      select 1
      from public.watchlists
      where watchlists.id = watchlist_items.watchlist_id
        and watchlists.user_id = auth.uid()
    )
  );

create policy "wli_upd_owner"
  on public.watchlist_items for update
  using (
    exists (
      select 1
      from public.watchlists
      where watchlists.id = watchlist_items.watchlist_id
        and watchlists.user_id = auth.uid()
    )
  );

create policy "wli_del_owner"
  on public.watchlist_items for delete
  using (
    exists (
      select 1
      from public.watchlists
      where watchlists.id = watchlist_items.watchlist_id
        and watchlists.user_id = auth.uid()
    )
  );

/* saved_files - idempotent policies */
drop policy if exists "sf_select_owner" on public.saved_files;
drop policy if exists "sf_ins_owner" on public.saved_files;
drop policy if exists "sf_upd_owner" on public.saved_files;
drop policy if exists "sf_del_owner" on public.saved_files;

create policy "sf_select_owner"
  on public.saved_files for select
  using ( auth.uid() = user_id );

create policy "sf_ins_owner"
  on public.saved_files for insert
  with check ( auth.uid() = user_id );

create policy "sf_upd_owner"
  on public.saved_files for update
  using ( auth.uid() = user_id );

create policy "sf_del_owner"
  on public.saved_files for delete
  using ( auth.uid() = user_id );
