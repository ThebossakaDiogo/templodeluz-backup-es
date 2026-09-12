update public.pix_products
set amount_cents = 6000,
    allow_custom_amount = true,
    minimum_amount_cents = 6000,
    maximum_amount_cents = 15000,
    description = 'Conversa individual de 1 hora, acolhimento aprofundado de 2 horas ou chamada de 2 horas com 3 dias de acompanhamento espiritual pelo WhatsApp.',
    updated_at = now()
where id = 'chamada_ao_vivo_milena';
