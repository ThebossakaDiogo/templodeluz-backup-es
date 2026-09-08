update public.pix_products as live_call
set
  customer_email = carta.customer_email,
  customer_cpf = carta.customer_cpf,
  customer_phone = carta.customer_phone,
  updated_at = now()
from public.pix_products as carta
where live_call.id = 'chamada_ao_vivo_milena'
  and carta.id = 'carta_sagrada';
