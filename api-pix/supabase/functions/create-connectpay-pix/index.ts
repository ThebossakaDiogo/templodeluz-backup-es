// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { digits, isUuid, isValidCpf, resolveChargeAmount } from '../_shared/pix.ts';

const allowedOrigins = (Deno.env.get('CORS_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

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

function chargeResponse(order: Record<string, unknown>, statusToken: string) {
  return {
    orderId: order.id,
    statusToken,
    pixPayload: order.pix_payload,
    qrCodeBase64: order.qr_code_base64 ?? null,
    expiresAt: order.expires_at ?? null,
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
  if (origin && !isAllowedOrigin(origin)) return json(origin, { error: 'Origem nao autorizada.' }, 403);

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
    const productId = typeof input?.productId === 'string' ? input.productId.trim().toLowerCase() : '';
    const requestedAmountCents = input?.amountCents;
    const customerName = typeof input?.customerName === 'string'
      ? input.customerName.trim().replace(/\s+/g, ' ').slice(0, 120)
      : '';
    const idempotencyKey = input?.idempotencyKey;
    const suppliedStatusToken = typeof input?.statusToken === 'string' ? input.statusToken : '';
    const statusToken = suppliedStatusToken || `${crypto.randomUUID()}${crypto.randomUUID()}`;

    if (
      !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(productId)
      || customerName.length < 3
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
    const { data: existing, error: existingError } = await supabase
      .from('pix_orders')
      .select('id, status, status_token_hash, pix_payload, qr_code_base64, expires_at')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      if (existing.status_token_hash !== statusTokenHash) {
        return json(origin, { error: 'Chave de idempotencia ja utilizada.' }, 409);
      }
      if (existing.pix_payload) return json(origin, chargeResponse(existing, statusToken));
      return json(origin, { error: 'Esta cobranca ainda esta sendo processada. Tente novamente.' }, 409);
    }

    const authorization = req.headers.get('authorization') ?? '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '');
    const { data: auth } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : { data: { user: null } };

    const { data: product, error: productError } = await supabase
      .from('pix_products')
      .select('id, name, description, amount_cents, allow_custom_amount, minimum_amount_cents, maximum_amount_cents, customer_email, customer_cpf, customer_phone')
      .eq('id', productId)
      .eq('active', true)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) return json(origin, { error: 'Produto PIX indisponivel.' }, 404);

    const customerEmail = String(product.customer_email ?? '').trim().toLowerCase();
    const customerCpf = digits(product.customer_cpf);
    const customerPhone = digits(product.customer_phone);
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

    const { data: order, error: orderError } = await supabase.from('pix_orders').insert({
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
    }).select('id').single();
    if (orderError || !order) throw orderError ?? new Error('ORDER_CREATION_FAILED');
    orderId = order.id;

    const gatewayResponse = await fetch('https://api.connectpay.vc/v1/transactions', {
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
      return json(origin, { error: 'Nao foi possivel gerar o PIX agora.' }, 502);
    }

    const { data: completedOrder, error: updateError } = await supabase.from('pix_orders').update({
      status: 'pending',
      connectpay_transaction_id: transactionId,
      connectpay_status: String(data?.status ?? 'PENDING').toUpperCase(),
      pix_payload: pixPayload,
      qr_code_base64: qrCodeBase64,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }).eq('id', order.id).select('id, pix_payload, qr_code_base64, expires_at').single();
    if (updateError || !completedOrder) throw updateError ?? new Error('ORDER_UPDATE_FAILED');

    return json(origin, chargeResponse(completedOrder, statusToken));
  } catch (error) {
    if (supabase && orderId) {
      await supabase.from('pix_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', orderId);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('create-connectpay-pix error', message);
    return json(
      origin,
      { error: message === 'CONFIGURATION_MISSING' ? 'A API PIX ainda nao foi configurada.' : 'Nao foi possivel gerar o PIX agora.' },
      500,
    );
  }
});
