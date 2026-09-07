insert into public.pix_products (
  id,
  name,
  description,
  amount_cents,
  allow_custom_amount,
  minimum_amount_cents,
  maximum_amount_cents,
  active
) values
  (
    'chamada_ao_vivo_milena',
    'Chamada Ao Vivo com Milena',
    'Chamada de video ao vivo com a medium Milena Medeiros. Contrato digital e agendamento com antecedencia minima de 2 horas inclusos.',
    15000,
    false,
    15000,
    15000,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  allow_custom_amount = excluded.allow_custom_amount,
  minimum_amount_cents = excluded.minimum_amount_cents,
  maximum_amount_cents = excluded.maximum_amount_cents,
  active = excluded.active,
  updated_at = now();
