-- 20250814090000_presence_v2.sql
-- Presence v2: table, indexes, RLS, realtime, RPC. Idempotent.

-- Table & indexes
create table if not exists public.presence (
  org_id text not null,
  user_id text not null,
  status text not null check (status in ('online','idle','offline')),
  last_seen_at timestamptz not null default now(),
  meta jsonb,
  primary key (org_id, user_id)
);
create index if not exists presence_org_last_seen on public.presence (org_id, last_seen_at desc);

-- Enable RLS
alter table public.presence enable row level security;

-- Org isolation policy (requires org_id in JWT claims)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'presence_org_isolation'
      and tablename = 'presence'
  ) then
    create policy presence_org_isolation
      on public.presence
      using (org_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id', ''))
      with check (org_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'org_id', ''));
  end if;
end $$;

-- Realtime needs old values
alter table public.presence replica identity full;

-- Publication: ensure table is in supabase_realtime
do $$
begin
  perform 1
    from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname='public' and tablename='presence';
  if not found then
    alter publication supabase_realtime add table public.presence;
  end if;
end $$;

-- RPC for heartbeat upsert
create or replace function public.presence_heartbeat(
  p_org_id text,
  p_user_id text,
  p_status text default 'online',
  p_meta jsonb default null
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.presence(org_id, user_id, status, last_seen_at, meta)
  values (p_org_id, p_user_id, p_status, now(), p_meta)
  on conflict (org_id, user_id) do update set
    status = coalesce(excluded.status, public.presence.status),
    meta   = coalesce(excluded.meta,   public.presence.meta),
    last_seen_at = now();
$$;


