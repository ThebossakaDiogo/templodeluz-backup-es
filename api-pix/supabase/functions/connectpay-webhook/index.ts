// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { amountToCents, isUuid } from '../_shared/pix.ts';

function serviceRoleKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const expectedToken = Deno.env.get('CONNECTPAY_WEBHOOK_TOKEN');
    const receivedToken = new URL(req.url).searchParams.get('token');
    if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
      return new Response('Not found', { status: 404 });
    }

    const payload = await req.json().catch(() => null) as Record<string, unknown> | null;
    const event = (payload?.data && typeof payload.data === 'object' ? payload.data : payload) as Record<string, unknown> | null;
    const orderId = String(event?.external_id ?? '').trim();
    const transactionId = String(event?.id ?? '').trim();
    if (!isUuid(orderId) || !transactionId) return Response.json({ received: true });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secretKey = serviceRoleKey();
    const apiSecret = Deno.env.get('CONNECTPAY_API_SECRET');
    if (!supabaseUrl || !secretKey || !apiSecret) throw new Error('CONFIGURATION_MISSING');
    const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // O payload externo nao aprova pagamento sozinho. A transacao e relida no provedor.
    const verification = await fetch(
      `https://api.connectpay.vc/v1/transactions/${encodeURIComponent(transactionId)}`,
      {
        signal: AbortSignal.timeout(15_000),
        headers: { 'api-secret': apiSecret, 'Content-Type': 'application/json' },
      },
    );
    const verificationPayload = await verification.json().catch(() => ({}));
    const transaction = verificationPayload?.data ?? verificationPayload;
    const verifiedOrderId = String(transaction?.external_id ?? '').trim();
    const verifiedTransactionId = String(transaction?.id ?? transactionId).trim();
    const verifiedStatus = String(transaction?.status ?? '').trim().toUpperCase();
    const amountCents = amountToCents(transaction?.total_amount ?? transaction?.amount);
    if (
      !verification.ok
      || verifiedOrderId !== orderId
      || verifiedTransactionId !== transactionId
      || !verifiedStatus
      || amountCents === null
    ) {
      throw new Error('TRANSACTION_VERIFICATION_FAILED');
    }

    const { data: result, error } = await supabase.rpc('process_connectpay_webhook', {
      p_order_id: orderId,
      p_transaction_id: transactionId,
      p_status: verifiedStatus,
      p_amount_cents: amountCents,
      p_payload: verificationPayload,
    });
    if (error) throw error;

    // Se aprovado/pago, sincroniza funil, whatsapp e notifica UTMify
    if (verifiedStatus === 'PAID' || verifiedStatus === 'APPROVED') {
      try {
        const { data: orderData } = await supabase
          .from('pix_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        // 1. Sincronização em Cascata: atualiza quiz_funnel_leads
        if (orderData?.session_id) {
          await supabase.from('quiz_funnel_leads').update({
            payment_status: 'paid',
            checkout_status: 'paid',
            completed: true,
            last_amount_cents: amountCents,
            updated_at: new Date().toISOString(),
          }).eq('session_id', orderData.session_id).catch(() => {});
        }

        if (orderData?.customer_phone) {
          await supabase.from('quiz_funnel_leads').update({
            payment_status: 'paid',
            checkout_status: 'paid',
            completed: true,
            last_amount_cents: amountCents,
            updated_at: new Date().toISOString(),
          }).eq('lead_phone', orderData.customer_phone).catch(() => {});

          await supabase.from('whatsapp_conversations').update({
            payment_status: 'paid',
            payment_method: 'pix',
            amount_cents: amountCents,
          }).eq('customer_phone', orderData.customer_phone).catch(() => {});
        }

        if (orderData?.customer_email) {
          await supabase.from('quiz_funnel_leads').update({
            payment_status: 'paid',
            checkout_status: 'paid',
            completed: true,
            last_amount_cents: amountCents,
            updated_at: new Date().toISOString(),
          }).eq('lead_email', orderData.customer_email).catch(() => {});
        }

        // 2. Disparo UTMify com dados reais e parâmetros de rastreamento completos
        const utmifyToken = 'Szz1ObkJ95rX3A8C3M7VcjACLPHBRAr5HGx4';
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const nowFormatted = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

        const utmifyPayload = {
          orderId: orderId,
          platform: 'TemploDeLuz',
          paymentMethod: 'pix',
          status: 'paid',
          createdAt: nowFormatted,
          approvedDate: nowFormatted,
          customer: {
            name: String(orderData?.customer_name || transaction?.customer?.name || 'Consulente Templo de Luz'),
            email: String(orderData?.customer_email || transaction?.customer?.email || 'contato@templodeluz.com'),
            phone: String(orderData?.customer_phone || transaction?.customer?.phone || '11999999999'),
            document: '00000000000',
            country: 'BR',
          },
          products: [
            {
              id: orderData?.product_id || 'carta_sagrada',
              name: orderData?.product_name || 'Carta Psicografada Sagrada',
              planId: 'plano_unico',
              planName: 'Pagamento Único',
              quantity: 1,
              priceInCents: amountCents,
            },
          ],
          trackingParameters: {
            src: orderData?.src || null,
            sck: null,
            utm_source: orderData?.utm_source || null,
            utm_medium: orderData?.utm_medium || null,
            utm_campaign: orderData?.utm_campaign || null,
            utm_content: orderData?.utm_content || null,
            utm_term: orderData?.utm_term || null,
          },
          commission: {
            totalPriceInCents: amountCents,
            gatewayFeeInCents: 0,
            userCommissionInCents: amountCents,
            currency: 'BRL',
          },
          isTest: false,
        };

        await fetch('https://api.utmify.com.br/api-credentials/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-token': utmifyToken,
          },
          body: JSON.stringify(utmifyPayload),
        });
      } catch (utmErr) {
        console.warn('[CONNECTPAY WEBHOOK SYNC/UTMIFY ERROR]', utmErr);
      }
    }

    return Response.json({ received: true, processed: result?.processed === true });
  } catch (error) {
    console.error('connectpay-webhook error', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
});
