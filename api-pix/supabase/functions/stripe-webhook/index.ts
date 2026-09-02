// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    const signature = req.headers.get('stripe-signature');
    const bodyText = await req.text();
    let event = null;

    try {
      event = JSON.parse(bodyText);
    } catch {
      return new Response('Invalid JSON payload', { status: 400 });
    }

    console.log(`[STRIPE WEBHOOK] Evento recebido: ${event?.type} | ID: ${event?.id}`);

    // Se o webhook secret estiver configurado, podemos logar a validação
    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const customerEmail = session?.customer_details?.email || session?.customer_email;
      const customerName = session?.customer_details?.name || session?.metadata?.customerName;
      const amountTotal = session?.amount_total;
      const productId = session?.metadata?.productId || 'carta_sagrada';

      console.log(`[STRIPE PAGAMENTO APROVADO]`, {
        sessionId: session?.id,
        productId,
        customerName,
        customerEmail,
        amountCents: amountTotal,
      });

      // Se tiver Supabase configurado, pode salvar na tabela de pedidos se desejar
      if (supabaseUrl && serviceRoleKey) {
        try {
          const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          await supabase.from('pix_orders').insert({
            idempotency_key: crypto.randomUUID(),
            product_id: productId,
            product_name: productId === 'carta_sagrada' ? 'Carta Psicografada Sagrada' : 'Cirurgia Médium Milena',
            amount_cents: amountTotal || 1900,
            customer_name: customerName || 'Cliente Stripe',
            customer_email: customerEmail || 'stripe@cliente.com',
            customer_cpf: '00000000000',
            customer_phone: '00000000000',
            status: 'paid',
            status_token_hash: 'stripe_payment_' + String(session?.id || Date.now()),
            fulfilled_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('[STRIPE DB LOG]', dbErr);
        }
      }
    }

    return Response.json({ received: true, eventId: event?.id }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[STRIPE WEBHOOK ERROR]', err);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500, headers: corsHeaders });
  }
});
