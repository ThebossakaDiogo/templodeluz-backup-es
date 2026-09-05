// @ts-nocheck
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
    const bodyText = await req.text();
    let event = null;

    try {
      event = JSON.parse(bodyText);
    } catch {
      return new Response('Invalid JSON payload', { status: 400 });
    }

    console.log(`[STRIPE WEBHOOK] Evento recebido: ${event?.type} | ID: ${event?.id}`);

    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const customerEmail = session?.customer_details?.email || session?.customer_email || 'contato@templodeluz.com';
      const customerName = session?.customer_details?.name || session?.metadata?.customerName || 'Consulente Templo de Luz';
      const amountTotal = Number(session?.amount_total) || 1900;
      const productId = session?.metadata?.productId || 'carta_sagrada';
      const telemetrySessionId = session?.metadata?.telemetrySessionId || session?.client_reference_id;

      console.log(`[STRIPE PAGAMENTO APROVADO]`, {
        sessionId: session?.id,
        productId,
        customerName,
        customerEmail,
        amountCents: amountTotal,
        telemetrySessionId,
      });

      // 1. Persistência no Supabase para o painel OD METRICS
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://yfpiqfytonuhigwkssio.supabase.co';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

        if (supabaseKey) {
          // Gravação do pedido de cartão na tabela pix_orders
          await fetch(`${supabaseUrl}/rest/v1/pix_orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              product_id: productId,
              product_name: productId === 'carta_sagrada' ? 'Carta Psicografada Sagrada' : 'Cirurgia Médium Milena',
              amount_cents: amountTotal,
              status: 'paid',
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: session?.customer_details?.phone || '11999999999',
              customer_cpf: '00000000000',
              status_token_hash: '0000000000000000000000000000000000000000000000000000000000000000',
              connectpay_transaction_id: `stripe_${session?.id}`,
              payment_method: 'credit_card',
              gateway: 'stripe',
            }),
          }).catch((e) => console.warn('[SUPABASE ORDER INSERT WARN]', e));

          // Atualização da telemetria do lead no funil
          if (telemetrySessionId) {
            await fetch(`${supabaseUrl}/rest/v1/quiz_funnel_leads?session_id=eq.${telemetrySessionId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                payment_status: 'paid',
                last_amount_cents: amountTotal,
                completed: true,
                updated_at: new Date().toISOString(),
              }),
            }).catch((e) => console.warn('[SUPABASE LEAD UPDATE WARN]', e));
          }
        }
      } catch (dbErr) {
        console.warn('[SUPABASE SYNC ERROR]', dbErr);
      }

      // 2. Disparo automático e redundante para a API da UTMify
      try {
        const utmifyToken = 'Szz1ObkJ95rX3A8C3M7VcjACLPHBRAr5HGx4';
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const nowFormatted = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

        const utmifyPayload = {
          orderId: String(session?.id || `stripe_${Date.now()}`),
          platform: 'TemploDeLuz',
          paymentMethod: 'credit_card',
          status: 'paid',
          createdAt: nowFormatted,
          approvedDate: nowFormatted,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: session?.customer_details?.phone || '11999999999',
            document: '00000000000',
            country: 'BR',
          },
          products: [
            {
              id: productId,
              name: productId === 'carta_sagrada' ? 'Carta Psicografada Sagrada' : 'Cirurgia Médium Milena',
              planId: 'plano_unico',
              planName: 'Pagamento Único',
              quantity: 1,
              priceInCents: amountTotal,
            },
          ],
          trackingParameters: {
            src: session?.metadata?.src || null,
            sck: session?.metadata?.sck || null,
            utm_source: session?.metadata?.utm_source || null,
            utm_medium: session?.metadata?.utm_medium || null,
            utm_campaign: session?.metadata?.utm_campaign || null,
            utm_content: session?.metadata?.utm_content || null,
            utm_term: session?.metadata?.utm_term || null,
          },
          commission: {
            totalPriceInCents: amountTotal,
            gatewayFeeInCents: 0,
            userCommissionInCents: amountTotal,
            currency: 'BRL',
          },
          isTest: false,
        };

        const resUtm = await fetch('https://api.utmify.com.br/api-credentials/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-token': utmifyToken,
          },
          body: JSON.stringify(utmifyPayload),
        });

        console.log('[STRIPE WEBHOOK] Resposta UTMify:', resUtm.status, await resUtm.text());
      } catch (utmifyErr) {
        console.warn('[STRIPE WEBHOOK UTMIFY ERROR]', utmifyErr);
      }
    }

    return Response.json({ received: true, eventId: event?.id }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[STRIPE WEBHOOK ERROR]', err);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500, headers: corsHeaders });
  }
});
