// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isUuid } from '../_shared/pix.ts';

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
  if (origin && !isAllowedOrigin(origin)) return json(origin, { error: 'Origem nao autorizada.' }, 403);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secretKey = serviceRoleKey();
    if (!supabaseUrl || !secretKey || allowedOrigins.length === 0) throw new Error('CONFIGURATION_MISSING');
    const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const input = await req.json().catch(() => null) as Record<string, unknown> | null;
    const orderId = input?.orderId;
    const statusToken = typeof input?.statusToken === 'string' ? input.statusToken : '';
    if (!isUuid(orderId) || statusToken.length < 32 || statusToken.length > 200) {
      return json(origin, { error: 'Consulta PIX invalida.' }, 400);
    }

    const { data: order, error } = await supabase
      .from('pix_orders')
      .select('id, user_id, status, status_token_hash, expires_at, updated_at')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw error;
    if (!order) return json(origin, { error: 'Cobranca PIX nao encontrada.' }, 404);

    const authorization = req.headers.get('authorization') ?? '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '');
    const { data: auth } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : { data: { user: null } };
    const ownsOrder = Boolean(auth.user && order.user_id === auth.user.id);
    const hasStatusToken = order.status_token_hash === await sha256(statusToken);
    if (!ownsOrder && !hasStatusToken) return json(origin, { error: 'Cobranca PIX nao encontrada.' }, 404);

    return json(origin, {
      status: order.status,
      paid: order.status === 'paid',
      expiresAt: order.expires_at,
      updatedAt: order.updated_at,
    });
  } catch (error) {
    console.error('get-connectpay-pix-status error', error instanceof Error ? error.message : error);
    return json(origin, { error: 'Nao foi possivel consultar o PIX agora.' }, 500);
  }
});
