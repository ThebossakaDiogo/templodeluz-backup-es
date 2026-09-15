-- Pedidos que possuem QR e transação ConnectPay pendente são cobranças válidas.
-- Não podem permanecer falhos por erro posterior de telemetria/atribuição.
update public.pix_orders
set status = 'pending',
    updated_at = now()
where status = 'failed'
  and pix_payload is not null
  and connectpay_transaction_id is not null
  and upper(coalesce(connectpay_status, '')) in ('PENDING', 'WAITING_PAYMENT', 'PROCESSING', 'CREATED');
