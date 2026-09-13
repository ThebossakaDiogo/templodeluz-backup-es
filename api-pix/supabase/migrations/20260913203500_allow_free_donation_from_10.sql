update public.pix_products
set minimum_amount_cents = 1000,
    amount_cents = 4000,
    updated_at = now()
where id in ('carta_sagrada', 'cirurgia_milena');
