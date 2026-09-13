update public.pix_products
set minimum_amount_cents = 1500,
    amount_cents = 3500,
    updated_at = now()
where id in ('carta_sagrada', 'cirurgia_milena');
