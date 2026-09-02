// @ts-nocheck
const allowedOrigins = (Deno.env.get('CORS_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const localDevelopmentOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

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

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors(origin) });
  }
  if (req.method !== 'POST') return json(origin, { error: 'Método não permitido.' }, 405);

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return json(
        origin,
        {
          error: 'STRIPE_NOT_CONFIGURED',
          message: 'A chave secreta da Stripe (STRIPE_SECRET_KEY) ainda não foi adicionada nas variáveis de ambiente.',
        },
        500,
      );
    }

    const input = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const amountCents = Number(input?.amountCents);
    const productName = String(input?.productName || 'Contribuição Sagrada - Templo de Luz');
    const customerName = String(input?.customerName || '').trim();
    const successUrl = String(input?.successUrl || '');
    const cancelUrl = String(input?.cancelUrl || '');

    if (!amountCents || isNaN(amountCents) || amountCents < 100) {
      return json(origin, { error: 'Valor inválido. O valor mínimo é R$ 1,00.' }, 400);
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append('line_items[0][price_data][currency]', 'brl');
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(amountCents)));
    params.append('line_items[0][price_data][product_data][name]', productName);
    params.append('line_items[0][quantity]', '1');

    if (successUrl) params.append('success_url', successUrl);
    if (cancelUrl) params.append('cancel_url', cancelUrl);
    if (customerName) params.append('metadata[customerName]', customerName);

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok || !session?.url) {
      console.error('Stripe error:', session);
      return json(
        origin,
        { error: session?.error?.message || 'Falha ao criar sessão na Stripe.' },
        stripeResponse.status,
      );
    }

    return json(origin, {
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('Internal error:', err);
    return json(origin, { error: 'Erro interno ao processar Stripe.' }, 500);
  }
});
