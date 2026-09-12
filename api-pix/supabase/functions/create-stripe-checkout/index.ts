// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = (Deno.env.get('CORS_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const localDevelopmentOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const checkoutOrigins = new Set([
  'https://templodeluz.com',
  'https://templodeluz-milenamedeiros.vercel.app',
  ...localDevelopmentOrigins,
]);

const supportedProducts = new Set(['carta_sagrada', 'cirurgia_milena', 'chamada_ao_vivo_milena']);
const QUIZ_ORIGIN = 'original';

function isAllowedOrigin(origin: string) {
  return !origin || allowedOrigins.includes(origin) || localDevelopmentOrigins.has(origin) || true;
}

function cors(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function json(origin: string, body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { ...cors(origin), 'Cache-Control': 'no-store' },
  });
}

function serviceRoleKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? null;
  } catch {
    return null;
  }
}

function hasProjectApiKey(req: Request) {
  const expected = [Deno.env.get('SUPABASE_ANON_KEY')].filter(Boolean);
  try {
    expected.push(...Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')));
  } catch {
    // Compatibilidade com ambientes que ainda usam somente a chave anônima legada.
  }
  const apiKey = req.headers.get('apikey') ?? '';
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  return Boolean(apiKey && expected.includes(apiKey) && (!bearer || expected.includes(bearer)));
}

function getReturnUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return checkoutOrigins.has(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}

function getTrackingValue(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
}

function getMetaAttributionValue(value: unknown, maximumLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maximumLength) : '';
}

function isTikTokTraffic(tracking: Record<string, unknown>) {
  const source = getTrackingValue(tracking.utm_source).toLowerCase();
  return Boolean(getTrackingValue(tracking.ttclid)) || /^(tiktok|tt|tik)(?:$|[^a-z])/.test(source);
}

function normalizeMetaTracking(tracking: Record<string, unknown>) {
  const source = getTrackingValue(tracking.utm_source).toLowerCase();
  if (!/^(facebook|fb|instagram|ig)(?:$|[^a-z])/.test(source)) return tracking;
  return {
    ...tracking,
    src: getTrackingValue(tracking.src) || 'meta',
    utm_campaign: getTrackingValue(tracking.utm_campaign) || 'meta_campaign_not_provided',
    utm_content: getTrackingValue(tracking.utm_content) || 'meta_adset_not_provided',
    utm_term: getTrackingValue(tracking.utm_term) || 'meta_ad_not_provided',
  };
}

function getCustomerValue(value: unknown, maximumLength: number) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maximumLength) : '';
}

function resolveAmount(product: Record<string, unknown>, requestedAmountCents: unknown) {
  const amountCents = Number(requestedAmountCents);
  if (!Number.isInteger(amountCents)) return null;

  const catalogAmount = Number(product.amount_cents);
  const minimum = Number(product.minimum_amount_cents);
  const maximum = Number(product.maximum_amount_cents);
  if (!product.allow_custom_amount) return amountCents === catalogAmount ? catalogAmount : null;
  if (amountCents < minimum || amountCents > maximum) return null;
  return amountCents;
}

function catalogProductId(productId: string) {
  return productId === 'chamada_ao_vivo_milena' ? 'carta_sagrada' : productId;
}

function displayProductName(productId: string, catalogName: unknown) {
  if (productId === 'chamada_ao_vivo_milena') return 'Chamada Ao Vivo com Milena';
  return String(catalogName);
}

function formatUtmifyDate(value = new Date()) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`;
}

function sendStripeWaitingPaymentToUtmify(input: {
  sessionId: string;
  productId: string;
  productName: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tracking: Record<string, unknown>;
}) {
  const token = Deno.env.get('UTMIFY_API_TOKEN');
  if (!token) return;
  const trackingParameters = Object.fromEntries(
    ['src', 'sck', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
      .map((key) => [key, getTrackingValue(input.tracking[key]) || null]),
  );
  const delivery = fetch('https://api.utmify.com.br/api-credentials/orders', {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
    headers: { 'Content-Type': 'application/json', 'x-api-token': token },
    body: JSON.stringify({
      orderId: input.sessionId,
      platform: 'TemploDeLuzMeta',
      paymentMethod: 'credit_card',
      status: 'waiting_payment',
      createdAt: formatUtmifyDate(),
      approvedDate: null,
      refundedAt: null,
      customer: {
        name: input.customerName || 'Consulente Templo de Luz',
        email: input.customerEmail || 'contato@templodeluz.com',
        phone: input.customerPhone || null,
        document: null,
        country: 'BR',
      },
      products: [{ id: input.productId, name: input.productName, planId: null, planName: null, quantity: 1, priceInCents: input.amountCents }],
      trackingParameters,
      commission: { totalPriceInCents: input.amountCents, gatewayFeeInCents: 0, userCommissionInCents: input.amountCents, currency: 'BRL' },
      isTest: false,
    }),
  }).then(async (response) => {
    if (!response.ok) console.warn('[STRIPE CHECKOUT] UTMify waiting payment failed', response.status, (await response.text()).slice(0, 300));
  }).catch((error) => console.warn('[STRIPE CHECKOUT] UTMify waiting payment failed', error instanceof Error ? error.message : error));

  const edgeRuntime = (globalThis as any).EdgeRuntime;
  if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(delivery);
  else void delivery;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors(origin) });
  }
  if (req.method !== 'POST') return json(origin, { error: 'Método não permitido.' }, 405);
  if (!hasProjectApiKey(req)) return json(origin, { error: 'Não autorizado.' }, 401);

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = serviceRoleKey();
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
      return json(origin, { error: 'CHECKOUT_NOT_CONFIGURED' }, 500);
    }

    const input = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (input?.action === 'verify_session') {
      const sessionId = getCustomerValue(input?.sessionId, 255);
      const expectedProductId = getCustomerValue(input?.productId, 64).toLowerCase();
      const expectedAmountCents = Number(input?.amountCents);
      if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !supportedProducts.has(expectedProductId) || !Number.isInteger(expectedAmountCents)) {
        return json(origin, { error: 'Dados de verificação inválidos.' }, 400);
      }

      const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });
      const session = await stripeResponse.json().catch(() => null);
      if (!stripeResponse.ok) return json(origin, { error: 'Sessão não encontrada.' }, 404);
      const isPaid = session?.payment_status === 'paid'
        && session?.status === 'complete'
        && session?.metadata?.productId === expectedProductId
        && session?.metadata?.quizOrigin === QUIZ_ORIGIN
        && Number(session?.amount_total) === expectedAmountCents;
      return json(origin, { paid: isPaid, sessionId: isPaid ? sessionId : undefined });
    }

    const productId = getCustomerValue(input?.productId, 64).toLowerCase();
    const customerName = getCustomerValue(input?.customerName, 120);
    const customerEmail = getCustomerValue(input?.customerEmail, 254).toLowerCase();
    const customerPhone = getCustomerValue(input?.customerPhone, 20).replace(/\D/g, '');
    const telemetrySessionId = getCustomerValue(input?.telemetrySessionId, 120);
    const successUrl = getReturnUrl(input?.successUrl);
    const cancelUrl = getReturnUrl(input?.cancelUrl);
    const idempotencyKey = getCustomerValue(input?.idempotencyKey, 64);

    if (!supportedProducts.has(productId) || !successUrl || !cancelUrl || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
      return json(origin, { error: 'Dados do checkout inválidos.' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: product, error: productError } = await supabase
      .from('pix_products')
      .select('id, name, amount_cents, allow_custom_amount, minimum_amount_cents, maximum_amount_cents')
      .eq('id', catalogProductId(productId))
      .eq('active', true)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) return json(origin, { error: 'Produto indisponível.' }, 404);

    const amountCents = productId === 'chamada_ao_vivo_milena'
      ? Number(input?.amountCents)
      : resolveAmount(product, input?.amountCents);
    const isValidLiveCallAmount = productId !== 'chamada_ao_vivo_milena'
      || [6000, 10000, 15000].includes(amountCents);
    if (amountCents === null || !Number.isInteger(amountCents) || !isValidLiveCallAmount) {
      return json(origin, { error: 'Valor inválido para este produto.' }, 400);
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append('phone_number_collection[enabled]', 'true');
    params.append('line_items[0][price_data][currency]', 'brl');
    params.append('line_items[0][price_data][unit_amount]', String(amountCents));
    params.append('line_items[0][price_data][product_data][name]', displayProductName(productId, product.name));
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('metadata[productId]', productId);
    params.append('metadata[quizOrigin]', QUIZ_ORIGIN);
    params.append('metadata[orderIdempotencyKey]', idempotencyKey);
    if (customerName) params.append('metadata[customerName]', customerName);
    if (customerPhone.length >= 10 && customerPhone.length <= 13) params.append('metadata[customerPhone]', customerPhone);
    if (telemetrySessionId) {
      params.append('client_reference_id', telemetrySessionId);
      params.append('metadata[telemetrySessionId]', telemetrySessionId);
    }
    if (/^\S+@\S+\.\S+$/.test(customerEmail)) params.append('customer_email', customerEmail);

    const trackingParams = normalizeMetaTracking((input?.trackingParameters || {}) as Record<string, unknown>);
    if (isTikTokTraffic(trackingParams)) {
      return json(origin, { error: 'Use o quiz TikTok para concluir este checkout.' }, 400);
    }
    for (const key of ['src', 'sck', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const value = getTrackingValue(trackingParams[key]);
      if (value) params.append(`metadata[${key}]`, value);
    }
    const metaAttribution = (input?.metaAttribution || {}) as Record<string, unknown>;
    const metaFbp = getMetaAttributionValue(metaAttribution.fbp, 255);
    const metaFbc = getMetaAttributionValue(metaAttribution.fbc, 255);
    const metaEventSourceUrl = getMetaAttributionValue(metaAttribution.eventSourceUrl, 500);
    if (metaFbp) params.append('metadata[metaFbp]', metaFbp);
    if (metaFbc) params.append('metadata[metaFbc]', metaFbc);
    if (metaEventSourceUrl) params.append('metadata[metaEventSourceUrl]', metaEventSourceUrl);

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': idempotencyKey,
      },
      body: params.toString(),
    });
    const session = await stripeResponse.json();

    if (!stripeResponse.ok || !session?.url) {
      console.error('Stripe session creation failed', stripeResponse.status, session?.error?.type ?? 'unknown');
      return json(origin, { error: 'Falha ao criar sessão na Stripe.' }, 502);
    }

    sendStripeWaitingPaymentToUtmify({
      sessionId: session.id,
      productId,
      productName: displayProductName(productId, product.name),
      amountCents,
      customerName,
      customerEmail,
      customerPhone,
      tracking: trackingParams,
    });

    return json(origin, { url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error', error instanceof Error ? error.message : 'unknown');
    return json(origin, { error: 'Erro interno ao processar Stripe.' }, 500);
  }
});
