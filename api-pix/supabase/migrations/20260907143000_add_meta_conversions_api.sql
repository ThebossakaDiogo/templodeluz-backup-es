alter table public.pix_orders
  add column if not exists meta_fbp text,
  add column if not exists meta_fbc text,
  add column if not exists meta_client_ip_address text,
  add column if not exists meta_client_user_agent text,
  add column if not exists meta_event_source_url text,
  add column if not exists meta_initiate_checkout_event_id text;

create table if not exists public.meta_conversion_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pix_orders(id) on delete cascade,
  event_name text not null check (event_name in ('InitiateCheckout', 'Purchase')),
  event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'queued'
    check (delivery_status in ('queued', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  claim_token uuid,
  http_status integer,
  response_body text,
  last_error text,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, event_name),
  unique (event_id, event_name)
);

create index if not exists meta_conversion_deliveries_due_idx
  on public.meta_conversion_deliveries (next_attempt_at, last_attempt_at)
  where delivery_status in ('queued', 'failed', 'processing');

alter table public.meta_conversion_deliveries enable row level security;
revoke all on public.meta_conversion_deliveries from public, anon, authenticated;

create or replace function public.claim_meta_conversion_delivery(
  p_order_id uuid,
  p_event_name text,
  p_event_id text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim_token uuid := gen_random_uuid();
  v_claimed_token uuid;
begin
  insert into public.meta_conversion_deliveries (
    order_id, event_name, event_id, payload
  ) values (
    p_order_id, p_event_name, p_event_id, coalesce(p_payload, '{}'::jsonb)
  )
  on conflict do nothing;

  update public.meta_conversion_deliveries
  set delivery_status = 'processing',
      claim_token = v_claim_token,
      event_id = p_event_id,
      payload = coalesce(p_payload, '{}'::jsonb),
      attempts = attempts + 1,
      last_attempt_at = now(),
      updated_at = now()
  where order_id = p_order_id
    and event_name = p_event_name
    and attempts < 10
    and (
      (delivery_status in ('queued', 'failed') and next_attempt_at <= now())
      or (delivery_status = 'processing' and last_attempt_at < now() - interval '5 minutes')
    )
  returning claim_token into v_claimed_token;

  return v_claimed_token;
end;
$$;

create or replace function public.finish_meta_conversion_delivery(
  p_order_id uuid,
  p_event_name text,
  p_claim_token uuid,
  p_success boolean,
  p_http_status integer,
  p_response_body text,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finished boolean := false;
begin
  update public.meta_conversion_deliveries
  set delivery_status = case when p_success then 'sent' else 'failed' end,
      claim_token = null,
      http_status = p_http_status,
      response_body = left(coalesce(p_response_body, ''), 2000),
      last_error = nullif(left(coalesce(p_error, ''), 1000), ''),
      next_attempt_at = case
        when p_success then next_attempt_at
        else now() + make_interval(secs => least(3600, (power(2, least(attempts, 8)) * 15)::integer))
      end,
      sent_at = case when p_success then now() else sent_at end,
      updated_at = now()
  where order_id = p_order_id
    and event_name = p_event_name
    and claim_token = p_claim_token
  returning true into v_finished;

  return coalesce(v_finished, false);
end;
$$;

create or replace function public.finalize_connectpay_pix_creation(
  p_order_id uuid,
  p_transaction_id text,
  p_connectpay_status text,
  p_pix_payload text,
  p_qr_code_base64 text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.pix_orders%rowtype;
begin
  select * into v_order
  from public.pix_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'PIX order not found';
  end if;

  if v_order.connectpay_transaction_id is not null
    and v_order.connectpay_transaction_id <> p_transaction_id then
    raise exception 'ConnectPay transaction does not match order';
  end if;

  update public.pix_orders
  set status = 'pending',
      connectpay_transaction_id = p_transaction_id,
      connectpay_status = upper(trim(coalesce(p_connectpay_status, 'PENDING'))),
      pix_payload = p_pix_payload,
      qr_code_base64 = p_qr_code_base64,
      expires_at = p_expires_at,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.meta_conversion_deliveries (
    order_id, event_name, event_id
  ) values (
    v_order.id,
    'InitiateCheckout',
    coalesce(nullif(v_order.meta_initiate_checkout_event_id, ''), 'ic_' || v_order.id::text)
  ) on conflict do nothing;

  return to_jsonb(v_order);
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
    connectpay_transaction_id, status, order_id, payload
  ) values (
    p_transaction_id, normalized_status, p_order_id, coalesce(p_payload, '{}'::jsonb)
  ) on conflict do nothing;

  get diagnostics event_inserted = row_count;

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
    set status = local_status,
        connectpay_transaction_id = p_transaction_id,
        connectpay_status = normalized_status,
        fulfilled_at = case when local_status = 'paid' then coalesce(fulfilled_at, now()) else fulfilled_at end,
        updated_at = now()
    where id = p_order_id
    returning * into current_order;
  else
    update public.pix_orders
    set connectpay_transaction_id = p_transaction_id,
        connectpay_status = normalized_status,
        updated_at = now()
    where id = p_order_id
    returning * into current_order;
  end if;

  if local_status = 'paid' then
    insert into public.meta_conversion_deliveries (order_id, event_name, event_id)
    values
      (current_order.id, 'InitiateCheckout', coalesce(nullif(current_order.meta_initiate_checkout_event_id, ''), 'ic_' || current_order.id::text)),
      (current_order.id, 'Purchase', current_order.id::text)
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'processed', true,
    'duplicate', event_inserted = 0,
    'status', local_status
  );
end;
$$;

revoke all on function public.claim_meta_conversion_delivery(uuid, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.finish_meta_conversion_delivery(uuid, text, uuid, boolean, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.finalize_connectpay_pix_creation(uuid, text, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.claim_meta_conversion_delivery(uuid, text, text, jsonb)
  to service_role;
grant execute on function public.finish_meta_conversion_delivery(uuid, text, uuid, boolean, integer, text, text)
  to service_role;
grant execute on function public.finalize_connectpay_pix_creation(uuid, text, text, text, text, timestamptz)
  to service_role;

insert into public.meta_conversion_deliveries (order_id, event_name, event_id)
select id, 'InitiateCheckout', 'ic_' || id::text
from public.pix_orders
where created_at >= now() - interval '6 days'
  and connectpay_transaction_id is not null
on conflict do nothing;

insert into public.meta_conversion_deliveries (order_id, event_name, event_id)
select id, 'Purchase', id::text
from public.pix_orders
where status = 'paid'
  and coalesce(fulfilled_at, updated_at) >= now() - interval '6 days'
on conflict do nothing;
