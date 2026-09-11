update public.pix_products
set amount_cents = 15000,
    allow_custom_amount = true,
    minimum_amount_cents = 15000,
    maximum_amount_cents = 50000,
    description = 'Chamada de video ao vivo com pacotes de 2 horas, 4 horas ou acompanhamento semanal por 100 dias, escolhidos antes do pagamento.',
    updated_at = now()
where id = 'chamada_ao_vivo_milena';
