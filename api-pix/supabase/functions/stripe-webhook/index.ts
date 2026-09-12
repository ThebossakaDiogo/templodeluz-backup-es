// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { deliverMetaPurchase, runInBackground } from '../_shared/meta-conversions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, stripe-signature',
};
const QUIZ_ORIGIN = 'original';

function serviceRoleKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? null;
  } catch {
    return null;
  }
}

function cleanString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hasValidStripeSignature(bodyText: string, header: string | null, secret: string) {
  if (!header) return false;
  const pairs = header.split(',').map((entry) => entry.trim().split('='));
  const timestamp = pairs.find(([key]) => key === 't')?.[1] ?? '';
  const signatures = pairs.filter(([key]) => key === 'v1').map(([, value]) => value);
  const timestampValue = Number(timestamp);
  if (!Number.isInteger(timestampValue) || Math.abs(Date.now() / 1000 - timestampValue) > 300) {
    return false;
  }
  const expected = await hmacSha256(secret, `${timestamp}.${bodyText}`);
  return signatures.some((signature) => signature === expected);
}

function productName(productId: string, catalogName: unknown) {
  if (productId === 'chamada_ao_vivo_milena') return 'Chamada Ao Vivo com Milena';
  if (typeof catalogName === 'string' && catalogName.trim()) return catalogName.trim();
  return productId === 'cirurgia_milena' ? 'Cirurgia Médium Milena' : 'Carta Psicografada Sagrada';
}

function catalogProductId(productId: string) {
  return productId === 'chamada_ao_vivo_milena' ? 'carta_sagrada' : productId;
}

function formatUtmifyDate(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Método não permitido', { status: 405 });

  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const bodyText = await req.text();
    if (!webhookSecret || !(await hasValidStripeSignature(bodyText, req.headers.get('stripe-signature'), webhookSecret))) {
      return new Response('Assinatura Stripe inválida', { status: 401 });
    }

    const event = JSON.parse(bodyText);
    if (event?.type !== 'checkout.session.completed') {
      return Response.json({ received: true, eventId: event?.id }, { headers: corsHeaders });
    }

    const session = event.data?.object;
    if (session?.payment_status !== 'paid' || !session?.id) {
      return Response.json({ received: true, eventId: event?.id }, { headers: corsHeaders });
    }
    if (session?.metadata?.quizOrigin !== QUIZ_ORIGIN) {
      return Response.json({ received: true, ignored: true, eventId: event?.id }, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = serviceRoleKey();
    if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_NOT_CONFIGURED');

    const productId = cleanString(session?.metadata?.productId, 64).toLowerCase();
    const idempotencyKey = cleanString(session?.metadata?.orderIdempotencyKey, 64);
    const amountCents = Number(session?.amount_total);
    const isValidLiveCallAmount = productId !== 'chamada_ao_vivo_milena'
      || [6000, 10000, 15000].includes(amountCents);
    if (!['carta_sagrada', 'cirurgia_milena', 'chamada_ao_vivo_milena'].includes(productId) || !/^[0-9a-f-]{36}$/i.test(idempotencyKey) || !Number.isInteger(amountCents) || amountCents < 100 || !isValidLiveCallAmount) {
      throw new Error('INVALID_STRIPE_SESSION_METADATA');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: product, error: productError } = await supabase
      .from('pix_products')
      .select('id, name, customer_email, customer_cpf, customer_phone')
      .eq('id', catalogProductId(productId))
      .eq('active', true)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) throw new Error('PRODUCT_NOT_FOUND');

    const customerName = cleanString(session?.customer_details?.name || session?.metadata?.customerName, 120) || 'Consulente Templo de Luz';
    const customerEmail = cleanString(session?.customer_details?.email || session?.customer_email || product.customer_email, 254).toLowerCase();
    const customerPhone = cleanString(session?.customer_details?.phone || session?.metadata?.customerPhone || product.customer_phone, 20).replace(/\D/g, '');
    const customerCpf = cleanString(product.customer_cpf, 11).replace(/\D/g, '');
    if (!/^\S+@\S+\.\S+$/.test(customerEmail) || !/^\d{10,13}$/.test(customerPhone) || !/^\d{11}$/.test(customerCpf)) {
      throw new Error('MISSING_CUSTOMER_DATA');
    }

    const stripeSessionId = String(session.id);
    const statusTokenHash = await sha256(`stripe:${stripeSessionId}`);
    const order = {
      idempotency_key: idempotencyKey,
      product_id: catalogProductId(productId),
      product_name: productName(productId, product.name),
      checkout_product_id: productId,
      amount_cents: amountCents,
      status: 'paid',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_cpf: customerCpf,
      status_token_hash: statusTokenHash,
      connectpay_transaction_id: `stripe_${stripeSessionId}`,
      payment_method: 'credit_card',
      gateway: 'stripe',
      stripe_session_id: stripeSessionId,
      fulfilled_at: new Date().toISOString(),
      quiz_origin: QUIZ_ORIGIN,
      meta_fbp: cleanString(session?.metadata?.metaFbp, 255) || null,
      meta_fbc: cleanString(session?.metadata?.metaFbc, 255) || null,
      meta_event_source_url: cleanString(session?.metadata?.metaEventSourceUrl, 500) || null,
      src: cleanString(session?.metadata?.src, 500) || null,
      sck: cleanString(session?.metadata?.sck, 500) || null,
      utm_source: cleanString(session?.metadata?.utm_source, 500) || null,
      utm_medium: cleanString(session?.metadata?.utm_medium, 500) || null,
      utm_campaign: cleanString(session?.metadata?.utm_campaign, 500) || null,
      utm_content: cleanString(session?.metadata?.utm_content, 500) || null,
      utm_term: cleanString(session?.metadata?.utm_term, 500) || null,
    };
    const { error: orderError } = await supabase
      .from('pix_orders')
      .upsert(order, { onConflict: 'idempotency_key', ignoreDuplicates: false });
    if (orderError) throw orderError;

    const { data: orderForDelivery, error: orderForDeliveryError } = await supabase
      .from('pix_orders')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (orderForDeliveryError || !orderForDelivery) throw orderForDeliveryError ?? new Error('STRIPE_ORDER_NOT_FOUND');
    runInBackground(deliverMetaPurchase(supabase, orderForDelivery), 'STRIPE META PURCHASE DELIVERY');

    const telemetrySessionId = cleanString(session?.metadata?.telemetrySessionId || session?.client_reference_id, 120);
    if (telemetrySessionId) {
      const { error: leadError } = await supabase
        .from('quiz_funnel_leads')
        .update({
          payment_status: 'paid',
          last_amount_cents: amountCents,
          completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', telemetrySessionId);
      if (leadError) console.warn('[STRIPE WEBHOOK] Lead telemetry update failed', leadError.code);
    }

    const utmifyToken = Deno.env.get('UTMIFY_API_TOKEN');
    if (utmifyToken) {
      const now = formatUtmifyDate();
      const trackingParameters = Object.fromEntries(
        ['src', 'sck', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
          .map((key) => [key, cleanString(session?.metadata?.[key], 500) || null]),
      );
      const utmifyResponse = await fetch('https://api.utmify.com.br/api-credentials/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-token': utmifyToken },
        body: JSON.stringify({
          orderId: stripeSessionId,
          platform: 'TemploDeLuzMeta',
          paymentMethod: 'credit_card',
          status: 'paid',
          createdAt: now,
          approvedDate: now,
          customer: { name: customerName, email: customerEmail, phone: customerPhone, document: customerCpf, country: 'BR' },
          products: [{ id: productId, name: productName(productId, product.name), planId: 'plano_unico', planName: 'Pagamento Único', quantity: 1, priceInCents: amountCents }],
          trackingParameters,
          commission: { totalPriceInCents: amountCents, gatewayFeeInCents: 0, userCommissionInCents: amountCents, currency: 'BRL' },
          isTest: false,
        }),
      });
      if (!utmifyResponse.ok) console.warn('[STRIPE WEBHOOK] UTMify delivery failed', utmifyResponse.status);
    }

    return Response.json({ received: true, eventId: event.id }, { headers: corsHeaders });
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Failed', error instanceof Error ? error.message : 'unknown');
    return Response.json({ error: 'Webhook handler failed' }, { status: 500, headers: corsHeaders });
  }
});
