update public.pix_products
set amount_cents = greatest(amount_cents, 3000),
    minimum_amount_cents = 1500,
    updated_at = now()
where id in ('carta_sagrada', 'cirurgia_milena');
