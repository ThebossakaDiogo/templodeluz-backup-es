// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { amountToCents, isUuid, normalizeConnectPayStatus } from '../_shared/pix.ts';
import { deliverMetaUtmifyPaidOrder } from '../_shared/utmify.ts';
import { deliverMetaPurchase, runInBackground } from '../_shared/meta-conversions.ts';

const QUIZ_ORIGIN = 'original';
const PIX_ACCOUNT_KEY = 'connectpay_original';

function serviceRoleKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? null;
  } catch {
    return null;
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const expectedToken = Deno.env.get('CONNECTPAY_WEBHOOK_TOKEN');
    const configuredWebhookUrl = Deno.env.get('CONNECTPAY_WEBHOOK_URL');
    let configuredUrlToken: string | null = null;
    try {
      configuredUrlToken = configuredWebhookUrl
        ? new URL(configuredWebhookUrl).searchParams.get('token')
        : null;
    } catch {
      configuredUrlToken = null;
    }
    const receivedToken = new URL(req.url).searchParams.get('token');
    const tokenMatches = Boolean(
      receivedToken
      && ((expectedToken && receivedToken === expectedToken) || (configuredUrlToken && receivedToken === configuredUrlToken)),
    );
    if (!tokenMatches) {
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
    const accountFingerprint = (await sha256(apiSecret)).slice(0, 24);

    const { data: expectedOrder, error: expectedOrderError } = await supabase
      .from('pix_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (expectedOrderError) throw expectedOrderError;
    if (
      !expectedOrder
      || expectedOrder.quiz_origin !== QUIZ_ORIGIN
      || expectedOrder.pix_account_key !== PIX_ACCOUNT_KEY
      || expectedOrder.pix_account_fingerprint !== accountFingerprint
    ) {
      throw new Error('PIX_ACCOUNT_MISMATCH');
    }

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

    await supabase.from('connectpay_webhook_events').update({
      quiz_origin: QUIZ_ORIGIN,
      pix_account_key: PIX_ACCOUNT_KEY,
      pix_account_fingerprint: accountFingerprint,
    }).eq('order_id', orderId).eq('connectpay_transaction_id', transactionId).eq('status', verifiedStatus);

    // O pagamento e a outbox ja estao persistidos. Sincronizacoes externas rodam
    // fora do ACK para a ConnectPay nunca repetir um pagamento por falha de marketing.
    if (normalizeConnectPayStatus(verifiedStatus) === 'paid') {
      runInBackground((async () => {
        const { data: orderData, error: orderDataError } = await supabase
          .from('pix_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        if (orderDataError || !orderData) throw orderDataError ?? new Error('ORDER_NOT_FOUND');

        // 1. Sincronização em Cascata: atualiza quiz_funnel_leads
        const safeUpdate = async (label: string, promise: PromiseLike<unknown>) => {
          try {
            const result = await promise as { error?: unknown };
            if (result?.error) throw result.error;
          } catch (err) {
            console.warn(`[CONNECTPAY WEBHOOK SYNC WARN] ${label}`, err instanceof Error ? err.message : err);
          }
        };

        if (orderData?.session_id) {
          await safeUpdate('leads_by_session', supabase.from('quiz_funnel_leads').update({
            payment_status: 'paid',
            checkout_status: 'paid',
            completed: true,
            last_amount_cents: amountCents,
            updated_at: new Date().toISOString(),
          }).eq('session_id', orderData.session_id));
        }

        if (orderData?.customer_phone) {
          await safeUpdate('leads_by_phone', supabase.from('quiz_funnel_leads').update({
            payment_status: 'paid',
            checkout_status: 'paid',
            completed: true,
            last_amount_cents: amountCents,
            updated_at: new Date().toISOString(),
          }).eq('lead_phone', orderData.customer_phone));

          await safeUpdate('whatsapp_by_phone', supabase.from('whatsapp_conversations').update({
            payment_status: 'paid',
            payment_method: 'pix',
            amount_cents: amountCents,
          }).eq('customer_phone', orderData.customer_phone));
        }

        if (orderData?.customer_email) {
          await safeUpdate('leads_by_email', supabase.from('quiz_funnel_leads').update({
            payment_status: 'paid',
            checkout_status: 'paid',
            completed: true,
            last_amount_cents: amountCents,
            updated_at: new Date().toISOString(),
          }).eq('lead_email', orderData.customer_email));
        }

        const deliveries = await Promise.allSettled([
          deliverMetaUtmifyPaidOrder(supabase, orderData),
          deliverMetaPurchase(supabase, orderData),
        ]);
        deliveries.forEach((delivery) => {
          if (delivery.status === 'rejected') {
            console.warn('[CONNECTPAY WEBHOOK DELIVERY WARN]', delivery.reason);
          }
        });
      })(), 'CONNECTPAY PAID BACKGROUND SYNC');
    }

    return Response.json({ received: true, processed: result?.processed === true });
  } catch (error) {
    console.error('connectpay-webhook error', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
});
