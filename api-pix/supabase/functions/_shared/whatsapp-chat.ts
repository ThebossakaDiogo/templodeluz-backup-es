import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const DASHBOARD_DEFAULT_ORIGINS = new Set([
  'https://odmetrics.vercel.app',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3011',
  'http://127.0.0.1:3011',
]);

export function serviceRoleKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? null;
  } catch {
    return null;
  }
}

export function chatClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = serviceRoleKey();
  if (!url || !key) throw new Error('CONFIGURATION_MISSING');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function dashboardOrigins() {
  const configured = (Deno.env.get('DASHBOARD_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DASHBOARD_DEFAULT_ORIGINS, ...configured]);
}

export function isDashboardOrigin(origin: string) {
  return dashboardOrigins().has(origin);
}

export function cors(origin: string) {
  return {
    'Access-Control-Allow-Origin': isDashboardOrigin(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-meta-authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export function json(origin: string, body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors(origin) });
}

export function allowedAdminEmails() {
  return new Set(
    (Deno.env.get('DASHBOARD_ALLOWED_ADMIN_EMAILS') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireDashboardAdmin(request: Request) {
  const metaUrl = Deno.env.get('DASHBOARD_META_SUPABASE_URL');
  const metaAnonKey = Deno.env.get('DASHBOARD_META_SUPABASE_ANON_KEY');
  // Meta invokes directly with Authorization; TikTok forwards that token explicitly.
  const authorization = request.headers.get('x-meta-authorization') ?? request.headers.get('authorization') ?? '';
  if (!metaUrl || !metaAnonKey || !authorization.startsWith('Bearer ')) return false;

  const response = await fetch(`${metaUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: metaAnonKey },
    signal: AbortSignal.timeout(10_000),
  });
  const user = await response.json().catch(() => null);
  const email = String(user?.email ?? '').trim().toLowerCase();
  return response.ok && allowedAdminEmails().has(email);
}

export function requestProfile(input: Record<string, unknown> | null, profileOrigin: string) {
  const requested = typeof input?.profileOrigin === 'string'
    ? input.profileOrigin.trim()
    : typeof input?.quizOrigin === 'string'
      ? input.quizOrigin.trim()
      : profileOrigin;
  return requested === profileOrigin;
}

export function cleanPhone(value: unknown) {
  const phone = String(value ?? '').replace(/\D/g, '');
  return /^[0-9]{8,16}$/.test(phone) ? phone : null;
}

export function cleanText(value: unknown, maxLength = 4000) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

export function timingSafeEqual(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function sendEvolutionMessage(phone: string, body: string, mediaUrl?: string | null) {
  const baseUrl = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '');
  const apiKey = Deno.env.get('EVOLUTION_API_KEY');
  const instance = Deno.env.get('EVOLUTION_INSTANCE');
  if (!baseUrl || !apiKey || !instance) throw new Error('EVOLUTION_CONFIGURATION_MISSING');

  const hasMedia = Boolean(mediaUrl);
  const response = await fetch(`${baseUrl}/${hasMedia ? 'message/sendMedia' : 'message/sendText'}/${encodeURIComponent(instance)}`, {
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(hasMedia
      ? { number: phone, mediatype: 'document', media: mediaUrl, caption: body }
      : { number: phone, text: body, options: { delay: 1000, presence: 'composing' } }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`EVOLUTION_HTTP_${response.status}`);
  return payload as Record<string, unknown>;
}

export function evolutionMessageId(payload: Record<string, unknown>) {
  return cleanText(payload?.key && typeof payload.key === 'object' ? (payload.key as Record<string, unknown>).id : payload?.id, 255) || null;
}
