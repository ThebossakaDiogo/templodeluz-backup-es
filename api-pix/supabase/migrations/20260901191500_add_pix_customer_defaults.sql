alter table public.pix_products
  add column if not exists customer_email text,
  add column if not exists customer_cpf text,
  add column if not exists customer_phone text;

alter table public.pix_products
  drop constraint if exists pix_products_customer_email_check,
  drop constraint if exists pix_products_customer_cpf_check,
  drop constraint if exists pix_products_customer_phone_check;

alter table public.pix_products
  add constraint pix_products_customer_email_check
    check (customer_email is null or char_length(customer_email) between 3 and 254),
  add constraint pix_products_customer_cpf_check
    check (customer_cpf is null or customer_cpf ~ '^[0-9]{11}$'),
  add constraint pix_products_customer_phone_check
    check (customer_phone is null or customer_phone ~ '^[0-9]{10,13}$');
