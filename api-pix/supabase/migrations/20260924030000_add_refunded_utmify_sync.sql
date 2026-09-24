-- Mantém as reversões como estado terminal para que a UTMIFY receba a baixa da venda.
alter table public.pix_orders
  drop constraint if exists pix_orders_status_check;

alter table public.pix_orders
  add constraint pix_orders_status_check
  check (status = any (array[
    'creating', 'pending', 'paid', 'failed', 'expired', 'in_dispute', 'refunded', 'chargeback'
  ]));

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
    when normalized_status in ('REFUND', 'REFUNDED') then 'refunded'
    when normalized_status = 'CHARGEBACK' then 'chargeback'
    else 'pending'
  end;

  if local_status in ('in_dispute', 'refunded', 'chargeback')
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
