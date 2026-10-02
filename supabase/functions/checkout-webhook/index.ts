import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STATUSES = new Set(['PENDING', 'AUTHORIZED', 'FAILED', 'CHARGEBACK', 'IN_DISPUTE']);
const VALID_ID = /^[A-Za-z0-9_-]{1,128}$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function cents(value: unknown) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null;
  const result = Math.round(Number(value) * 100);
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}

function providerTransaction(raw: Record<string, unknown>) {
  return raw.data && typeof raw.data === 'object' ? raw.data as Record<string, unknown> : raw;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Metodo nao permitido.' });

  try {
    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      return json(400, { ok: false, error: 'JSON invalido.' });
    }

    const transactionId = String(payload.id ?? payload.transaction_id ?? '');
    const externalId = payload.external_id == null ? '' : String(payload.external_id);
    if (!VALID_ID.test(transactionId) || (externalId && !VALID_ID.test(externalId))
      || (payload.transaction_id !== undefined && payload.transaction_id !== transactionId)) {
      return json(400, { ok: false, error: 'Identificadores invalidos.' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const connectPaySecret = Deno.env.get('CONNECTPAY_API_SECRET');
    if (!supabaseUrl || !serviceKey || !connectPaySecret) {
      return json(500, { ok: false, error: 'Integracao de pagamentos nao configurada.' });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let query = supabase.from('orders').select('*').eq('transaction_id', transactionId).limit(2);
    if (externalId) query = query.eq('external_id', externalId);
    const { data: orders, error: orderError } = await query;
    if (orderError) throw new Error(`Falha ao consultar pedido: ${orderError.message}`);
    if (!orders?.length) return json(503, { ok: false, error: 'Pedido ainda nao registrado.' });
    if (orders.length !== 1) return json(409, { ok: false, error: 'Pedido ambiguo.' });

    const order = orders[0];
    const amount = cents(order.amount);
    if (!VALID_ID.test(String(order.id ?? '')) || !VALID_ID.test(String(order.external_id ?? ''))
      || order.transaction_id !== transactionId || order.payment_method !== 'PIX' || amount === null) {
      return json(409, { ok: false, error: 'Dados do pedido inconsistentes.' });
    }

    const providerResponse = await fetch(
      `https://api.connectpay.vc/v1/transactions/${encodeURIComponent(transactionId)}`,
      {
        headers: { 'api-secret': connectPaySecret, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!providerResponse.ok) throw new Error(`ConnectPay HTTP ${providerResponse.status}`);
    const raw = await providerResponse.json() as Record<string, unknown>;
    const transaction = providerTransaction(raw);
    const status = String(transaction.status ?? '');
    if (raw.success === false || raw.hasError || transaction.hasError
      || transaction.id !== order.transaction_id || transaction.external_id !== order.external_id
      || (transaction.transaction_id !== undefined && transaction.transaction_id !== order.transaction_id)
      || transaction.payment_method !== 'PIX' || cents(transaction.total_amount) !== amount
      || !STATUSES.has(status)) {
      return json(409, { ok: false, error: 'Transacao nao corresponde ao pedido ou esta incompleta.' });
    }

    if (status !== order.status) {
      let update = supabase.from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('external_id', order.external_id)
        .eq('transaction_id', order.transaction_id)
        .eq('status', order.status)
        .select('id,status');
      if (order.updated_at) update = update.eq('updated_at', order.updated_at);
      const { data: saved, error: updateError } = await update;
      if (updateError) throw new Error(`Falha ao atualizar pedido: ${updateError.message}`);
      if (!saved || saved.length !== 1 || saved[0].status !== status) {
        return json(503, { ok: false, error: 'O pedido mudou durante a validacao.' });
      }
    }

    return json(200, { ok: true, status });
  } catch (error) {
    console.error('Erro no webhook ConnectPay:', error);
    return json(502, { ok: false, error: 'Nao foi possivel validar o pagamento.' });
  }
});
