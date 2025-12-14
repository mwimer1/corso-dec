-- Create saved_views table
create table if not exists public.saved_views (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  view_type text not null,
  view_config jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create watchlists table
create table if not exists public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create watchlist_items table
create table if not exists public.watchlist_items (
  id uuid default gen_random_uuid() primary key,
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create saved_files table
create table if not exists public.saved_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  file_type text not null,
  file_path text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists saved_views_user_id_idx on public.saved_views(user_id);
create index if not exists watchlists_user_id_idx on public.watchlists(user_id);
create index if not exists watchlist_items_watchlist_id_idx on public.watchlist_items(watchlist_id);
create index if not exists saved_files_user_id_idx on public.saved_files(user_id);

-- Enable RLS
alter table public.saved_views enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.saved_files enable row level security;

-- Create RLS policies (idempotent: drop if exists before create)
-- Note: This migration is superseded by 20250502061640_add_saved_views_and_watchlists.sql
-- but kept for historical migration path safety

drop policy if exists "Users can view their own saved views" on public.saved_views;
drop policy if exists "Users can insert their own saved views" on public.saved_views;
drop policy if exists "Users can update their own saved views" on public.saved_views;
drop policy if exists "Users can delete their own saved views" on public.saved_views;

create policy "Users can view their own saved views"
  on public.saved_views for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved views"
  on public.saved_views for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved views"
  on public.saved_views for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saved views"
  on public.saved_views for delete
  using (auth.uid() = user_id);

-- Similar policies for watchlists
drop policy if exists "Users can view their own watchlists" on public.watchlists;
drop policy if exists "Users can insert their own watchlists" on public.watchlists;
drop policy if exists "Users can update their own watchlists" on public.watchlists;
drop policy if exists "Users can delete their own watchlists" on public.watchlists;

create policy "Users can view their own watchlists"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "Users can insert their own watchlists"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watchlists"
  on public.watchlists for update
  using (auth.uid() = user_id);

create policy "Users can delete their own watchlists"
  on public.watchlists for delete
  using (auth.uid() = user_id);

-- Similar policies for watchlist_items
drop policy if exists "Users can view items in their watchlists" on public.watchlist_items;
drop policy if exists "Users can insert items into their watchlists" on public.watchlist_items;
drop policy if exists "Users can delete items from their watchlists" on public.watchlist_items;

create policy "Users can view items in their watchlists"
  on public.watchlist_items for select
  using (
    exists (
      select 1 from public.watchlists
      where watchlists.id = watchlist_items.watchlist_id
      and watchlists.user_id = auth.uid()
    )
  );

create policy "Users can insert items into their watchlists"
  on public.watchlist_items for insert
  with check (
    exists (
      select 1 from public.watchlists
      where watchlists.id = watchlist_items.watchlist_id
      and watchlists.user_id = auth.uid()
    )
  );

create policy "Users can delete items from their watchlists"
  on public.watchlist_items for delete
  using (
    exists (
      select 1 from public.watchlists
      where watchlists.id = watchlist_items.watchlist_id
      and watchlists.user_id = auth.uid()
    )
  );

-- Similar policies for saved_files
drop policy if exists "Users can view their own saved files" on public.saved_files;
drop policy if exists "Users can insert their own saved files" on public.saved_files;
drop policy if exists "Users can update their own saved files" on public.saved_files;
drop policy if exists "Users can delete their own saved files" on public.saved_files;

create policy "Users can view their own saved files"
  on public.saved_files for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved files"
  on public.saved_files for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved files"
  on public.saved_files for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saved files"
  on public.saved_files for delete
  using (auth.uid() = user_id); 