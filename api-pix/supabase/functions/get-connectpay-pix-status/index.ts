// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { amountToCents, isUuid, normalizeConnectPayStatus } from '../_shared/pix.ts';
import { deliverMetaUtmifyPaidOrder } from '../_shared/utmify.ts';
import { deliverMetaPurchase, runInBackground } from '../_shared/meta-conversions.ts';

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
  return Response.json(body, { status, headers: { ...cors(origin), 'Cache-Control': 'no-store' } });
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secretKey = serviceRoleKey();
    const apiSecret = Deno.env.get('CONNECTPAY_API_SECRET');
    if (!supabaseUrl || !secretKey || !apiSecret || allowedOrigins.length === 0) throw new Error('CONFIGURATION_MISSING');
    const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const accountFingerprint = (await sha256(apiSecret)).slice(0, 24);

    const input = await req.json().catch(() => null) as Record<string, unknown> | null;
    const orderId = input?.orderId;
    const requestedQuizOrigin = typeof input?.quizOrigin === 'string' ? input.quizOrigin.trim() : '';
    const statusToken = typeof input?.statusToken === 'string' ? input.statusToken : '';
    const requestedWaitMs = typeof input?.waitMs === 'number' && Number.isFinite(input.waitMs)
      ? Math.max(0, Math.min(25_000, Math.floor(input.waitMs)))
      : 0;
    if (requestedQuizOrigin !== QUIZ_ORIGIN || !isUuid(orderId) || statusToken.length < 32 || statusToken.length > 200) {
      return json(origin, { error: 'Consulta PIX invalida.' }, 400);
    }

    const authorization = req.headers.get('authorization') ?? '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '');
    const { data: auth } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : { data: { user: null } };

    const readStatus = async () => {
      const { data: order, error } = await supabase
        .from('pix_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (error) throw error;
      if (!order) return null;
      const ownsOrder = Boolean(auth.user && order.user_id === auth.user.id);
      const hasStatusToken = order.status_token_hash === await sha256(statusToken);
      if (!ownsOrder && !hasStatusToken) return null;
      if (
        order.quiz_origin !== QUIZ_ORIGIN
        || order.pix_account_key !== PIX_ACCOUNT_KEY
        || order.pix_account_fingerprint !== accountFingerprint
      ) return null;
      return order;
    };

    const first = await readStatus();
    if (!first) return json(origin, { error: 'Cobranca PIX nao encontrada.' }, 404);

    const terminalStatuses = new Set(['paid', 'failed', 'expired', 'in_dispute', 'chargeback']);

    const schedulePaidDeliveries = (order: Record<string, any>) => {
      runInBackground(Promise.allSettled([
        deliverMetaUtmifyPaidOrder(supabase, order),
        deliverMetaPurchase(supabase, order),
      ]).then((deliveries) => deliveries.forEach((delivery) => {
        if (delivery.status === 'rejected') {
          console.warn('Paid order delivery failed', delivery.reason instanceof Error ? delivery.reason.message : delivery.reason);
        }
      })), 'PAID ORDER DELIVERY');
    };

    const reconcileWithGateway = async (currentOrder: Record<string, any>) => {
      if (terminalStatuses.has(currentOrder.status) || !currentOrder.connectpay_transaction_id) {
        if (currentOrder.status === 'paid') schedulePaidDeliveries(currentOrder);
        return currentOrder;
      }

      const verification = await fetch(
        `https://api.connectpay.vc/v1/transactions/${encodeURIComponent(currentOrder.connectpay_transaction_id)}`,
        {
          signal: AbortSignal.timeout(10_000),
          headers: { 'api-secret': apiSecret, 'Content-Type': 'application/json' },
        },
      );
      const verificationPayload = await verification.json().catch(() => ({}));
      const transaction = verificationPayload?.data ?? verificationPayload;
      const verifiedOrderId = String(transaction?.external_id ?? '').trim();
      const verifiedTransactionId = String(transaction?.id ?? '').trim();
      const verifiedStatus = String(transaction?.status ?? '').trim().toUpperCase();
      const amountCents = amountToCents(transaction?.total_amount ?? transaction?.amount);
      if (
        !verification.ok
        || verifiedOrderId !== currentOrder.id
        || verifiedTransactionId !== currentOrder.connectpay_transaction_id
        || amountCents !== currentOrder.amount_cents
        || !verifiedStatus
      ) return currentOrder;

      const { error: processError } = await supabase.rpc('process_connectpay_webhook', {
        p_order_id: currentOrder.id,
        p_transaction_id: verifiedTransactionId,
        p_status: verifiedStatus,
        p_amount_cents: amountCents,
        p_payload: verificationPayload,
      });
      if (processError) throw processError;

      await supabase.from('connectpay_webhook_events').update({
        quiz_origin: QUIZ_ORIGIN,
        pix_account_key: PIX_ACCOUNT_KEY,
        pix_account_fingerprint: accountFingerprint,
      }).eq('order_id', currentOrder.id).eq('connectpay_transaction_id', verifiedTransactionId).eq('status', verifiedStatus);

      const refreshed = await readStatus();
      if (refreshed && normalizeConnectPayStatus(verifiedStatus) === 'paid') {
        schedulePaidDeliveries(refreshed);
      }
      return refreshed ?? currentOrder;
    };

    // Long-polling: segura a resposta até o status mudar (ou atingir o teto de tempo),
    // eliminando o intervalo fixo de polling no cliente e garantindo confirmação
    // praticamente instantânea após o webhook gravar o pagamento.
    let order = await reconcileWithGateway(first);
    if (requestedWaitMs > 0 && !terminalStatuses.has(order.status)) {
      const deadline = Date.now() + requestedWaitMs;
      while (Date.now() < deadline && !terminalStatuses.has(order.status)) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        const next = await readStatus();
        if (!next) break;
        order = await reconcileWithGateway(next);
      }
    }

    return json(origin, {
      status: order.status,
      paid: order.status === 'paid',
      expiresAt: order.expires_at,
      updatedAt: order.updated_at,
      quizOrigin: order.quiz_origin,
      pixAccountKey: order.pix_account_key,
    });
  } catch (error) {
    console.error('get-connectpay-pix-status error', error instanceof Error ? error.message : error);
    return json(origin, { error: 'Nao foi possivel consultar o PIX agora.' }, 500);
  }
});
