alter table public.pix_orders
  add column if not exists checkout_product_id text;
