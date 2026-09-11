update public.pix_products
set amount_cents = 2900,
    minimum_amount_cents = 1000,
    updated_at = now()
where id in ('carta_sagrada', 'cirurgia_milena');
