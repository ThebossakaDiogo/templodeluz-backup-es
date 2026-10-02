create table if not exists public.consultation_schedules (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  external_id text not null unique references public.orders(external_id) on delete cascade,
  name text,
  email text,
  ente text,
  package_amount numeric(10,2),
  package_title text,
  preferred_day text not null,
  preferred_hour text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists consultation_schedules_external_id_idx
  on public.consultation_schedules (external_id);

create unique index if not exists orders_transaction_id_unique_idx
  on public.orders (transaction_id)
  where transaction_id is not null and transaction_id <> '';

alter table public.consultation_schedules enable row level security;

drop policy if exists "service_role_manage_consultation_schedules" on public.consultation_schedules;
create policy "service_role_manage_consultation_schedules"
  on public.consultation_schedules
  for all
  to service_role
  using (true)
  with check (true);
