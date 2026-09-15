// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { deliverMetaUtmifyWaitingPaymentOrder, runUtmifyInBackground } from '../_shared/utmify.ts';
import { digits, isUuid, isValidCpf, resolveChargeAmount } from '../_shared/pix.ts';

const QUIZ_ORIGIN = 'original';
const PIX_ACCOUNT_KEY = 'connectpay_original';
const defaultAllowedOrigins = [
  'https://templodeluz-milenamedeiros.vercel.app',
  'https://templodeluz.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const allowedOrigins = defaultAllowedOrigins;

const localDevelopmentOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function isAllowedOrigin(origin: string) {
  return allowedOrigins.includes(origin) || localDevelopmentOrigins.has(origin);
}

function cors(origin: string) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : (allowedOrigins[0] ?? 'null'),
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
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!keys) return null;
  try {
    return JSON.parse(keys).default ?? null;
  } catch {
    return null;
  }
}

function hasProjectApiKey(req: Request) {
  const expected = [Deno.env.get('SUPABASE_ANON_KEY')].filter(Boolean);
  try {
    expected.push(...Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')));
  } catch {
    // Mantem compatibilidade com projetos que ainda usam apenas a chave legada.
  }
  const apiKey = req.headers.get('apikey') ?? '';
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  return Boolean(apiKey && expected.includes(apiKey) && (!bearer || expected.includes(bearer)));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function clientIp(req: Request) {
  return req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
}

function optionalMetaCookie(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().slice(0, 255) : '';
  return /^fb\.1\.\d{10,16}\.[^\s]{1,220}$/.test(normalized) ? normalized : null;
}

function eventSourceUrl(value: unknown, requestOrigin: string) {
  try {
    const source = new URL(typeof value === 'string' ? value : requestOrigin);
    if (!['http:', 'https:'].includes(source.protocol)) return requestOrigin || null;
    if (requestOrigin && source.origin !== requestOrigin) return requestOrigin;
    return source.toString().slice(0, 2048);
  } catch {
    return requestOrigin || null;
  }
}

function isTikTokTraffic(utms: Record<string, unknown>) {
  const source = String(utms.utm_source ?? '').trim().toLowerCase();
  return Boolean(String(utms.ttclid ?? '').trim()) || /^(tiktok|tt|tik)(?:$|[^a-z])/.test(source);
}

function normalizeMetaTracking(utms: Record<string, unknown>) {
  const source = String(utms.utm_source ?? '').trim().toLowerCase();
  if (!/^(facebook|fb|instagram|ig)(?:$|[^a-z])/.test(source)) return utms;
  return {
    ...utms,
    src: utms.src || 'meta',
    utm_campaign: utms.utm_campaign || 'meta_campaign_not_provided',
    utm_content: utms.utm_content || 'meta_adset_not_provided',
    utm_term: utms.utm_term || 'meta_ad_not_provided',
  };
}

function chargeResponse(order: Record<string, unknown>, statusToken: string) {
  return {
    orderId: order.id,
    transactionId: order.connectpay_transaction_id ?? null,
    statusToken,
    pixPayload: order.pix_payload,
    qrCodeBase64: order.qr_code_base64 ?? null,
    expiresAt: order.expires_at ?? null,
    quizOrigin: order.quiz_origin,
    pixAccountKey: order.pix_account_key,
    accountFingerprint: order.pix_account_fingerprint,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  if (req.method === 'OPTIONS') {
    return origin && !isAllowedOrigin(origin)
      ? new Response('Forbidden', { status: 403 })
      : new Response('ok', { headers: cors(origin) });
  }
  if (req.method !== 'POST') return json(origin, { error: 'Metodo nao permitido.' }, 405);
  if (!hasProjectApiKey(req)) return json(origin, { error: 'Nao autorizado.' }, 401);
  if (!origin || !isAllowedOrigin(origin)) return json(origin, { error: 'Origem nao autorizada.' }, 403);

  let supabase: ReturnType<typeof createClient> | null = null;
  let orderId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secretKey = serviceRoleKey();
    const apiSecret = Deno.env.get('CONNECTPAY_API_SECRET');
    const webhookUrl = Deno.env.get('CONNECTPAY_WEBHOOK_URL');
    if (!supabaseUrl || !secretKey || !apiSecret || !webhookUrl || allowedOrigins.length === 0) {
      throw new Error('CONFIGURATION_MISSING');
    }

    supabase = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const input = await req.json().catch(() => null) as Record<string, unknown> | null;
    const requestedQuizOrigin = typeof input?.quizOrigin === 'string' ? input.quizOrigin.trim() : '';
    const productId = typeof input?.productId === 'string' ? input.productId.trim().toLowerCase() : '';
    const requestedAmountCents = input?.amountCents;
    const customerName = typeof input?.customerName === 'string'
      ? input.customerName.trim().replace(/\s+/g, ' ').slice(0, 120)
      : '';
    const idempotencyKey = input?.idempotencyKey;
    const suppliedStatusToken = typeof input?.statusToken === 'string' ? input.statusToken : '';
    const statusToken = suppliedStatusToken || `${crypto.randomUUID()}${crypto.randomUUID()}`;

    if (
      requestedQuizOrigin !== QUIZ_ORIGIN
      || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(productId)
      || customerName.length < 2
      || !isUuid(idempotencyKey)
      || statusToken.length < 32
      || statusToken.length > 200
    ) {
      return json(origin, { error: 'Dados do checkout PIX invalidos.' }, 400);
    }

    const ipHash = await sha256(clientIp(req));
    const { data: allowed, error: rateError } = await supabase.rpc('consume_pix_rate_limit', {
      p_bucket: `pix-create:${ipHash}`,
      p_limit: 10,
      p_window_seconds: 3600,
    });
    if (rateError) throw rateError;
    if (!allowed) return json(origin, { error: 'Muitas tentativas. Aguarde antes de gerar outro PIX.' }, 429);

    const statusTokenHash = await sha256(statusToken);
    const accountFingerprint = (await sha256(apiSecret)).slice(0, 24);
    const { data: existing, error: existingError } = await supabase
      .from('pix_orders')
      .select('id, status, status_token_hash, connectpay_transaction_id, pix_payload, qr_code_base64, expires_at, quiz_origin, pix_account_key, pix_account_fingerprint')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      if (
        existing.quiz_origin !== QUIZ_ORIGIN
        || existing.pix_account_key !== PIX_ACCOUNT_KEY
        || existing.pix_account_fingerprint !== accountFingerprint
      ) return json(origin, { error: 'Chave de idempotencia vinculada a outra operacao.' }, 409);
      if (existing.status_token_hash !== statusTokenHash) {
        return json(origin, { error: 'Chave de idempotencia ja utilizada.' }, 409);
      }
      if (existing.pix_payload) return json(origin, chargeResponse(existing, statusToken));
      return json(origin, { error: 'Esta cobranca ainda esta sendo processada. Tente novamente.' }, 409);
    }

    const authorization = req.headers.get('authorization') ?? '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '');

    // Paraleliza a resolução do usuário e a busca do produto (economiza ~2 round-trips)
    const [authResult, productResult] = await Promise.all([
      accessToken
        ? supabase.auth.getUser(accessToken)
        : Promise.resolve({ data: { user: null } }),
      supabase
        .from('pix_products')
        .select('id, name, description, amount_cents, allow_custom_amount, minimum_amount_cents, maximum_amount_cents, customer_email, customer_cpf, customer_phone')
        .eq('id', productId)
        .eq('active', true)
        .maybeSingle(),
    ]);
    const auth = authResult.data;
    const { data: product, error: productError } = productResult;
    if (productError) throw productError;
    if (!product) return json(origin, { error: 'Produto PIX indisponivel.' }, 404);

    const fallbackEmail = String(product.customer_email ?? '').trim().toLowerCase();
    const customerCpf = digits(product.customer_cpf);
    const fallbackPhone = digits(product.customer_phone);

    // Prioriza os dados reais digitados pelo consulente
    const suppliedPhone = digits(input?.customerPhone);
    const customerPhone = (suppliedPhone && suppliedPhone.length >= 10 && suppliedPhone.length <= 13)
      ? suppliedPhone
      : fallbackPhone;

    const suppliedEmail = typeof input?.customerEmail === 'string' ? input.customerEmail.trim().toLowerCase() : '';
    const customerEmail = (/^\S+@\S+\.\S+$/.test(suppliedEmail))
      ? suppliedEmail
      : fallbackEmail;

    const sessionId = typeof input?.sessionId === 'string' ? input.sessionId.trim() : null;
    const enteQuerido = typeof input?.enteQuerido === 'string' ? input.enteQuerido.trim() : null;
    const grauParentesco = typeof input?.grauParentesco === 'string' ? input.grauParentesco.trim() : null;
    const rawUtmParams = (typeof input?.utms === 'object' && input.utms !== null ? input.utms : {}) as Record<string, unknown>;
    const utmParams = normalizeMetaTracking(rawUtmParams);
    if (isTikTokTraffic(utmParams)) {
      return json(origin, { error: 'Use o quiz TikTok para concluir este checkout.' }, 400);
    }
    const metaAttribution = (typeof input?.metaAttribution === 'object' && input.metaAttribution !== null
      ? input.metaAttribution
      : {}) as Record<string, unknown>;
    const initiateCheckoutEventId = typeof metaAttribution.initiateCheckoutEventId === 'string'
      && /^ic_[a-zA-Z0-9-]{16,100}$/.test(metaAttribution.initiateCheckoutEventId)
      ? metaAttribution.initiateCheckoutEventId
      : `ic_${idempotencyKey}`;

    if (
      !/^\S+@\S+\.\S+$/.test(customerEmail)
      || !isValidCpf(customerCpf)
      || customerPhone.length < 10
      || customerPhone.length > 13
    ) {
      throw new Error('CUSTOMER_CONFIGURATION_MISSING');
    }

    const amountCents = resolveChargeAmount(requestedAmountCents, {
      amountCents: product.amount_cents,
      allowCustomAmount: product.allow_custom_amount,
      minimumAmountCents: product.minimum_amount_cents,
      maximumAmountCents: product.maximum_amount_cents,
    });
    if (amountCents === null) {
      return json(origin, { error: 'Valor da cobranca PIX invalido.' }, 400);
    }
    if (productId === 'chamada_ao_vivo_milena' && ![6000, 10000, 15000].includes(amountCents)) {
      return json(origin, { error: 'Selecione um dos pacotes disponíveis para a chamada ao vivo.' }, 400);
    }

    const orderInsertPayload: Record<string, unknown> = {
      idempotency_key: idempotencyKey,
      user_id: auth.user?.id ?? null,
      product_id: product.id,
      product_name: product.name,
      amount_cents: amountCents,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_cpf: customerCpf,
      customer_phone: customerPhone,
      status_token_hash: statusTokenHash,
      quiz_origin: QUIZ_ORIGIN,
      pix_account_key: PIX_ACCOUNT_KEY,
      pix_account_fingerprint: accountFingerprint,
      meta_client_ip_address: clientIp(req),
      meta_client_user_agent: (req.headers.get('user-agent') ?? '').slice(0, 1000) || null,
      meta_event_source_url: eventSourceUrl(metaAttribution.eventSourceUrl, origin),
      meta_initiate_checkout_event_id: initiateCheckoutEventId,
    };

    const metaFbp = optionalMetaCookie(metaAttribution.fbp);
    const metaFbc = optionalMetaCookie(metaAttribution.fbc);
    if (metaFbp) orderInsertPayload.meta_fbp = metaFbp;
    if (metaFbc) orderInsertPayload.meta_fbc = metaFbc;

    if (sessionId) orderInsertPayload.session_id = sessionId;
    if (enteQuerido) orderInsertPayload.ente_querido = enteQuerido;
    if (grauParentesco) orderInsertPayload.grau_parentesco = grauParentesco;
    if (utmParams.utm_source) orderInsertPayload.utm_source = String(utmParams.utm_source);
    if (utmParams.utm_medium) orderInsertPayload.utm_medium = String(utmParams.utm_medium);
    if (utmParams.utm_campaign) orderInsertPayload.utm_campaign = String(utmParams.utm_campaign);
    if (utmParams.utm_content) orderInsertPayload.utm_content = String(utmParams.utm_content);
    if (utmParams.utm_term) orderInsertPayload.utm_term = String(utmParams.utm_term);
    if (utmParams.src) orderInsertPayload.src = String(utmParams.src);
    if (utmParams.sck) orderInsertPayload.sck = String(utmParams.sck);
    if (utmParams.ttclid) orderInsertPayload.ttclid = String(utmParams.ttclid);

    const { data: order, error: orderError } = await supabase
      .from('pix_orders')
      .insert(orderInsertPayload)
      .select('id')
      .single();
    if (orderError || !order) throw orderError ?? new Error('ORDER_CREATION_FAILED');
    orderId = order.id;

    // Sincronização com a tabela quiz_funnel_leads (executa em paralelo com o gateway)
    const leadSyncPromise = sessionId
      ? (async () => {
          try {
            const leadSyncPayload: Record<string, unknown> = {
              lead_name: customerName,
              lead_phone: customerPhone,
              lead_email: customerEmail,
              checkout_initiated: true,
              pix_generated: true,
              checkout_status: 'pix_generated',
              payment_status: 'waiting_payment',
              last_amount_cents: amountCents,
              updated_at: new Date().toISOString(),
            };
            if (enteQuerido) leadSyncPayload.ente_querido = enteQuerido;
            if (grauParentesco) leadSyncPayload.grau_parentesco = grauParentesco;
            const { error: leadSyncError } = await supabase
              .from('quiz_funnel_leads')
              .update(leadSyncPayload)
              .eq('session_id', sessionId);
            if (leadSyncError) throw leadSyncError;
          } catch (leadSyncError) {
            console.warn('lead sync failed (ignored)', leadSyncError instanceof Error ? leadSyncError.message : leadSyncError);
          }
        })()
      : Promise.resolve();

    const gatewayPromise = fetch('https://api.connectpay.vc/v1/transactions', {
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
      headers: { 'api-secret': apiSecret, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_id: order.id,
        total_amount: amountCents / 100,
        payment_method: 'PIX',
        webhook_url: webhookUrl,
        ip: clientIp(req) === 'unknown' ? undefined : clientIp(req),
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          document_type: 'CPF',
          document: customerCpf,
        },
        items: [{
          id: product.id,
          title: product.name,
          description: product.description || product.name,
          price: amountCents / 100,
          quantity: 1,
          is_physical: false,
        }],
      }),
    });

    const [gatewayResponse] = await Promise.all([gatewayPromise, leadSyncPromise]);
    const gateway = await gatewayResponse.json().catch(() => ({}));
    const data = gateway?.data ?? gateway;
    const pix = data?.pix ?? {};
    const transactionId = data?.id ? String(data.id) : '';
    const pixPayload = pix?.payload ?? pix?.emv ?? pix?.copy_paste ?? null;
    const qrCodeBase64 = pix?.qr_code_base64 ?? pix?.qrCodeBase64 ?? pix?.qrCode ?? null;
    const expiresAt = pix?.expires_at ?? null;

    if (!gatewayResponse.ok || !transactionId || !pixPayload) {
      await supabase.from('pix_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
      console.error('ConnectPay transaction creation failed', gatewayResponse.status, gateway?.message ?? gateway?.error);
      const gatewayErrorMessage = String(gateway?.error ?? gateway?.message ?? '').trim();
      const clientMessage = gatewayResponse.status === 403 || gatewayResponse.status === 401
        ? 'A API PIX ainda nao foi configurada.'
        : 'Nao foi possivel gerar o PIX agora.';
      return json(origin, {
        error: clientMessage,
        code: 'GATEWAY_ERROR',
        status: gatewayResponse.status,
        detail: gatewayErrorMessage.slice(0, 200),
      }, 502);
    }

    const { data: completedOrder, error: updateError } = await supabase.rpc('finalize_connectpay_pix_creation', {
      p_order_id: order.id,
      p_transaction_id: transactionId,
      p_connectpay_status: String(data?.status ?? 'PENDING').toUpperCase(),
      p_pix_payload: pixPayload,
      p_qr_code_base64: qrCodeBase64,
      p_expires_at: expiresAt,
    });
    if (updateError || !completedOrder) throw updateError ?? new Error('ORDER_UPDATE_FAILED');

    runUtmifyInBackground(
      deliverMetaUtmifyWaitingPaymentOrder(supabase, completedOrder),
      'UTMIFY WAITING PAYMENT DELIVERY',
    );

    // InitiateCheckout é enviado no clique que abre o modal, antes de qualquer PIX ser criado.
    // O banco legou uma outbox de IC vinculada ao pedido; ela não representa este estágio do funil.
    await supabase
      .from('meta_conversion_deliveries')
      .delete()
      .eq('order_id', completedOrder.id)
      .eq('event_name', 'InitiateCheckout');

    return json(origin, chargeResponse(completedOrder, statusToken));
  } catch (error) {
    if (supabase && orderId) {
      await supabase.from('pix_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', orderId);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('create-connectpay-pix error', message);
    if (error instanceof Error && error.stack) {
      console.error('create-connectpay-pix stack', error.stack);
    }
    return json(
      origin,
      {
        error: message === 'CONFIGURATION_MISSING' ? 'A API PIX ainda nao foi configurada.' : 'Nao foi possivel gerar o PIX agora.',
        code: message === 'CONFIGURATION_MISSING' ? 'CONFIGURATION_MISSING' : 'INTERNAL_ERROR',
        detail: message.slice(0, 200),
      },
      500,
    );
  }
});
