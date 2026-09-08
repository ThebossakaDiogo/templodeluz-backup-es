alter table public.pix_orders
  add column if not exists payment_method text,
  add column if not exists gateway text,
  add column if not exists stripe_session_id text,
  add column if not exists fulfilled_at timestamptz;

create unique index if not exists pix_orders_stripe_session_id_key
  on public.pix_orders (stripe_session_id)
  where stripe_session_id is not null;

alter table public.pix_orders
  drop constraint if exists pix_orders_payment_method_check;

alter table public.pix_orders
  add constraint pix_orders_payment_method_check
  check (payment_method is null or payment_method in ('pix', 'credit_card'));

alter table public.pix_orders
  drop constraint if exists pix_orders_gateway_check;

alter table public.pix_orders
  add constraint pix_orders_gateway_check
  check (gateway is null or gateway in ('connectpay', 'stripe'));
