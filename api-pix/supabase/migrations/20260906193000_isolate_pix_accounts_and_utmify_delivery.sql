alter table public.pix_orders
  add column if not exists session_id text,
  add column if not exists ente_querido text,
  add column if not exists grau_parentesco text,
  add column if not exists quiz_origin text,
  add column if not exists pix_account_key text,
  add column if not exists pix_account_fingerprint text;

create index if not exists pix_orders_quiz_origin_created_at_idx
  on public.pix_orders (quiz_origin, created_at desc);

create index if not exists pix_orders_pix_account_key_created_at_idx
  on public.pix_orders (pix_account_key, created_at desc);

alter table public.connectpay_webhook_events
  add column if not exists quiz_origin text,
  add column if not exists pix_account_key text,
  add column if not exists pix_account_fingerprint text;

create table if not exists public.utmify_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pix_orders(id) on delete cascade,
  destination text not null,
  event_status text not null,
  payload jsonb not null,
  delivery_status text not null default 'queued'
    check (delivery_status in ('queued', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  http_status integer,
  response_body text,
  last_error text,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, destination, event_status)
);

alter table public.utmify_deliveries enable row level security;
revoke all on public.utmify_deliveries from public, anon, authenticated;

create or replace function public.claim_utmify_delivery(
  p_order_id uuid,
  p_destination text,
  p_event_status text,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean := false;
begin
  insert into public.utmify_deliveries (
    order_id, destination, event_status, payload
  ) values (
    p_order_id, p_destination, p_event_status, p_payload
  )
  on conflict (order_id, destination, event_status) do nothing;

  update public.utmify_deliveries
  set delivery_status = 'processing',
      payload = p_payload,
      attempts = attempts + 1,
      last_attempt_at = now(),
      updated_at = now()
  where order_id = p_order_id
    and destination = p_destination
    and event_status = p_event_status
    and (
      delivery_status in ('queued', 'failed')
      or (delivery_status = 'processing' and last_attempt_at < now() - interval '5 minutes')
    )
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

create or replace function public.finish_utmify_delivery(
  p_order_id uuid,
  p_destination text,
  p_event_status text,
  p_success boolean,
  p_http_status integer,
  p_response_body text,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.utmify_deliveries
  set delivery_status = case when p_success then 'sent' else 'failed' end,
      http_status = p_http_status,
      response_body = left(p_response_body, 2000),
      last_error = left(p_error, 1000),
      sent_at = case when p_success then now() else sent_at end,
      updated_at = now()
  where order_id = p_order_id
    and destination = p_destination
    and event_status = p_event_status;
end;
$$;

revoke all on function public.claim_utmify_delivery(uuid, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.finish_utmify_delivery(uuid, text, text, boolean, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_utmify_delivery(uuid, text, text, jsonb)
  to service_role;
grant execute on function public.finish_utmify_delivery(uuid, text, text, boolean, integer, text, text)
  to service_role;
