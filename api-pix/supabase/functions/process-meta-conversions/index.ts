// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processPendingMetaConversions } from '../_shared/meta-conversions.ts';
import { processPaidUtmifyOrders } from '../_shared/utmify.ts';

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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!hasProjectApiKey(req)) return new Response('Forbidden', { status: 403 });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secretKey = serviceRoleKey();
    if (!supabaseUrl || !secretKey) throw new Error('CONFIGURATION_MISSING');

    const input = await req.json().catch(() => ({}));
    const limit = Number.isFinite(input?.limit) ? Number(input.limit) : 25;
    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [meta, utmify] = await Promise.all([
      processPendingMetaConversions(supabase, limit),
      processPaidUtmifyOrders(supabase, limit),
    ]);
    return Response.json({ processed: true, meta, utmify });
  } catch (error) {
    console.error('process-meta-conversions error', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Meta conversion processing failed' }, { status: 500 });
  }
});
