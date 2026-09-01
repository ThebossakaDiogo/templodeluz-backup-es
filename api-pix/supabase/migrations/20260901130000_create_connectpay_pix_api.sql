create table public.pix_products (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 500),
  amount_cents integer not null check (amount_cents >= 100),
  allow_custom_amount boolean not null default false,
  minimum_amount_cents integer not null default 100 check (minimum_amount_cents >= 100),
  maximum_amount_cents integer not null default 1000000 check (maximum_amount_cents >= minimum_amount_cents),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_cents between minimum_amount_cents and maximum_amount_cents)
);

create table public.pix_orders (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,
  product_id text not null references public.pix_products(id),
  product_name text not null,
  amount_cents integer not null check (amount_cents >= 100),
  currency text not null default 'BRL' check (currency = 'BRL'),
  status text not null default 'creating'
    check (status in ('creating', 'pending', 'paid', 'failed', 'expired', 'in_dispute', 'chargeback')),
  customer_name text not null check (char_length(customer_name) between 3 and 120),
  customer_email text not null check (char_length(customer_email) between 3 and 254),
  customer_cpf text not null check (customer_cpf ~ '^[0-9]{11}$'),
  customer_phone text not null check (customer_phone ~ '^[0-9]{10,13}$'),
  status_token_hash text not null check (status_token_hash ~ '^[0-9a-f]{64}$'),
  connectpay_transaction_id text unique,
  connectpay_status text,
  pix_payload text,
  qr_code_base64 text,
  expires_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.connectpay_webhook_events (
  connectpay_transaction_id text not null,
  status text not null,
  order_id uuid not null references public.pix_orders(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  primary key (connectpay_transaction_id, status)
);

create table public.pix_request_rate_limits (
  bucket text primary key,
  count integer not null default 0 check (count >= 0),
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pix_products enable row level security;
alter table public.pix_orders enable row level security;
alter table public.connectpay_webhook_events enable row level security;
alter table public.pix_request_rate_limits enable row level security;

create policy "Service role manages PIX products"
on public.pix_products for all to service_role using (true) with check (true);

create policy "Service role manages PIX orders"
on public.pix_orders for all to service_role using (true) with check (true);

create policy "Users read their own PIX orders"
on public.pix_orders for select to authenticated using (user_id = auth.uid());

create policy "Service role manages ConnectPay events"
on public.connectpay_webhook_events for all to service_role using (true) with check (true);

create policy "Service role manages PIX rate limits"
on public.pix_request_rate_limits for all to service_role using (true) with check (true);

create or replace function public.consume_pix_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.pix_request_rate_limits%rowtype;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit configuration';
  end if;

  select * into current_row
  from public.pix_request_rate_limits
  where bucket = p_bucket
  for update;

  if not found then
    insert into public.pix_request_rate_limits (bucket, count) values (p_bucket, 1);
    return true;
  end if;

  if current_row.window_started_at <= now() - make_interval(secs => p_window_seconds) then
    update public.pix_request_rate_limits
    set count = 1, window_started_at = now(), updated_at = now()
    where bucket = p_bucket;
    return true;
  end if;

  if current_row.count >= p_limit then
    return false;
  end if;

  update public.pix_request_rate_limits
  set count = count + 1, updated_at = now()
  where bucket = p_bucket;
  return true;
end;
$$;

create or replace function public.process_connectpay_webhook(
  p_order_id uuid,
  p_transaction_id text,
  p_status text,
  p_amount_cents integer,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.pix_orders%rowtype;
  normalized_status text := upper(trim(coalesce(p_status, '')));
  local_status text;
  event_inserted integer;
begin
  select * into current_order
  from public.pix_orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('processed', false, 'reason', 'order_not_found');
  end if;

  if current_order.amount_cents <> p_amount_cents then
    raise exception 'ConnectPay amount does not match order';
  end if;

  if current_order.connectpay_transaction_id is not null
    and current_order.connectpay_transaction_id <> p_transaction_id then
    raise exception 'ConnectPay transaction does not match order';
  end if;

  insert into public.connectpay_webhook_events (
    connectpay_transaction_id,
    status,
    order_id,
    payload
  ) values (
    p_transaction_id,
    normalized_status,
    p_order_id,
    coalesce(p_payload, '{}'::jsonb)
  ) on conflict do nothing;

  get diagnostics event_inserted = row_count;
  if event_inserted = 0 then
    return jsonb_build_object('processed', true, 'duplicate', true);
  end if;

  local_status := case
    when normalized_status in ('AUTHORIZED', 'PAID', 'APPROVED') then 'paid'
    when normalized_status in ('FAILED', 'DECLINED', 'CANCELED', 'CANCELLED') then 'failed'
    when normalized_status = 'EXPIRED' then 'expired'
    when normalized_status = 'IN_DISPUTE' then 'in_dispute'
    when normalized_status = 'CHARGEBACK' then 'chargeback'
    else 'pending'
  end;

  if local_status in ('in_dispute', 'chargeback')
    or current_order.status <> 'paid'
    or local_status = 'paid' then
    update public.pix_orders
    set
      status = local_status,
      connectpay_transaction_id = p_transaction_id,
      connectpay_status = normalized_status,
      fulfilled_at = case
        when local_status = 'paid' then coalesce(fulfilled_at, now())
        else fulfilled_at
      end,
      updated_at = now()
    where id = p_order_id;
  else
    update public.pix_orders
    set
      connectpay_transaction_id = p_transaction_id,
      connectpay_status = normalized_status,
      updated_at = now()
    where id = p_order_id;
  end if;

  return jsonb_build_object('processed', true, 'duplicate', false, 'status', local_status);
end;
$$;

revoke all on function public.consume_pix_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.process_connectpay_webhook(uuid, text, text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.consume_pix_rate_limit(text, integer, integer) to service_role;
grant execute on function public.process_connectpay_webhook(uuid, text, text, integer, jsonb) to service_role;

insert into public.pix_products (
  id,
  name,
  description,
  amount_cents,
  allow_custom_amount,
  minimum_amount_cents,
  maximum_amount_cents,
  active
) values
  (
    'carta_sagrada',
    'Doacao ao Templo de Luz',
    'Contribuicao fraterna para materiais, manutencao e obras assistenciais do Templo de Luz.',
    2900,
    true,
    1000,
    1000000,
    true
  ),
  (
    'cirurgia_milena',
    'Doacao para a cirurgia de Milena',
    'Contribuicao para exames, cirurgia e recuperacao ocular de Milena.',
    2900,
    true,
    1000,
    1000000,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  allow_custom_amount = excluded.allow_custom_amount,
  minimum_amount_cents = excluded.minimum_amount_cents,
  maximum_amount_cents = excluded.maximum_amount_cents,
  active = excluded.active,
  updated_at = now();
