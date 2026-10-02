import { purchasedPackage } from './create-pix.js';

const STATUSES = new Set(['PENDING', 'AUTHORIZED', 'FAILED', 'CHARGEBACK', 'IN_DISPUTE']);
const VALID_ID = /^[A-Za-z0-9_-]{1,128}$/;

function fail(statusCode, message) {
  throw Object.assign(new Error(message), { statusCode });
}

function cents(value) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null;
  const result = Math.round(Number(value) * 100);
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}

async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) fail(502, 'Nao foi possivel consultar ou registrar o pagamento.');
  return response.json();
}

export async function verifyPurchase(externalId, transactionId) {
  if ((!externalId && !transactionId)
    || (externalId !== undefined && (typeof externalId !== 'string' || !VALID_ID.test(externalId)))
    || (transactionId !== undefined && (typeof transactionId !== 'string' || !VALID_ID.test(transactionId)))) {
    fail(400, 'Pedido nao informado ou invalido.');
  }

  const supaUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.CONNECTPAY_API_SECRET;
  if (!supaUrl || !supaKey || !secret) fail(500, 'Integracao de pagamentos nao configurada.');

  const headers = { apikey: supaKey, Authorization: `Bearer ${supaKey}` };
  const query = new URLSearchParams({ select: '*', limit: '2' });
  if (externalId) query.set('external_id', `eq.${externalId}`);
  if (transactionId) query.set('transaction_id', `eq.${transactionId}`);
  const rows = await fetchJson(`${supaUrl}/rest/v1/orders?${query}`, { headers });
  if (!Array.isArray(rows) || rows.length > 1) fail(409, 'Pedido ambiguo.');
  const order = rows[0];
  if (!order) fail(404, 'Pedido nao registrado.');

  const amount = cents(order.amount);
  if (!VALID_ID.test(String(order.id || '')) || !VALID_ID.test(String(order.external_id || ''))
    || !VALID_ID.test(String(order.transaction_id || '')) || amount === null || order.payment_method !== 'PIX'
    || (externalId && externalId !== order.external_id) || (transactionId && transactionId !== order.transaction_id)) {
    fail(409, 'Dados do pedido inconsistentes.');
  }

  // A cached authorization is not sufficient after a chargeback or revocation.
  const raw = await fetchJson(`https://api.connectpay.vc/v1/transactions/${encodeURIComponent(order.transaction_id)}`, {
    headers: { 'api-secret': secret, 'Content-Type': 'application/json' },
  });
  const transaction = raw?.data ?? raw;
  if (raw?.success === false || raw?.hasError || transaction?.hasError
    || !transaction || transaction.id !== order.transaction_id || transaction.external_id !== order.external_id
    || (transaction.transaction_id !== undefined && transaction.transaction_id !== order.transaction_id)
    || transaction.payment_method !== 'PIX' || cents(transaction.total_amount) !== amount
    || !STATUSES.has(transaction.status)) {
    fail(409, 'Transacao nao corresponde ao pedido ou esta incompleta.');
  }

  const status = transaction.status;
  if (status !== order.status) {
    const updateQuery = new URLSearchParams({
      id: `eq.${order.id}`, external_id: `eq.${order.external_id}`, transaction_id: `eq.${order.transaction_id}`,
      amount: `eq.${order.amount}`, payment_method: 'eq.PIX', status: `eq.${order.status}`, select: '*',
    });
    if (order.updated_at != null) updateQuery.set('updated_at', `eq.${order.updated_at}`);
    const updated = await fetchJson(`${supaUrl}/rest/v1/orders?${updateQuery}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    });
    const saved = Array.isArray(updated) && updated.length === 1 ? updated[0] : null;
    if (!saved || saved.id !== order.id || saved.external_id !== order.external_id
      || saved.transaction_id !== order.transaction_id || cents(saved.amount) !== amount || saved.status !== status) {
      fail(503, 'O pedido mudou durante a validacao. Tente novamente.');
    }
  }

  return { ok: true, paid: status === 'AUTHORIZED', status, external_id: order.external_id,
    transaction_id: order.transaction_id, amount: order.amount, package: purchasedPackage(order) };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, paid: false, error: 'Metodo nao permitido.' });
  }
  try {
    return res.status(200).json(await verifyPurchase(req.query?.external_id, req.query?.transaction_id));
  } catch (error) {
    console.error('Erro em check-purchase:', error);
    return res.status(error.statusCode || 502).json({ ok: false, paid: false, error: 'Nao foi possivel validar o pagamento.' });
  }
}
