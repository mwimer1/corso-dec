-- v2025-06-15-audit
-- 20250615000003_audit_log.sql
create table if not exists public.audit_log (
  id uuid default gen_random_uuid() primary key,
  table_name text not null,
  record_id uuid not null,
  user_id uuid,
  op text not null,
  changed_at timestamptz default now() not null
);

create or replace function public.log_audit()
returns trigger
language plpgsql
as $$
begin
  insert into public.audit_log (table_name, record_id, user_id, op, changed_at)
  values (tg_table_name, coalesce(new.id, old.id), coalesce(new.user_id, old.user_id), tg_op, timezone('utc', now()));
  return null;
end;
$$;

create trigger trg_projects_log_audit
  after insert or update or delete on public.projects
  for each row execute procedure public.log_audit();

create trigger trg_watchlists_log_audit
  after insert or update or delete on public.watchlists
  for each row execute procedure public.log_audit();
