-- Enable RLS and policies for user_data, payment_history, api_keys

/* user_data table */
create table if not exists public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sensitive_data jsonb
);

/* payment_history table */
create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount decimal
);

/* api_keys table */
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text
);

/* indexes */
create index if not exists idx_user_data_user_id on public.user_data(user_id);
create index if not exists idx_payment_history_user_id on public.payment_history(user_id);
create index if not exists idx_api_keys_user_id on public.api_keys(user_id);

/* enable RLS */
alter table public.user_data enable row level security;
alter table public.payment_history enable row level security;
alter table public.api_keys enable row level security;

/* policies */
create policy "user_data_owner" on public.user_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "payment_history_owner" on public.payment_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "api_keys_owner" on public.api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
