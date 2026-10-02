import { verifyPurchase } from './check-purchase.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Metodo nao permitido.' });
  }
  try {
    let payload;
    try { payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({ ok: false, error: 'JSON invalido.' }); }
    const transactionId = payload?.id ?? payload?.transaction_id;
    if (!payload || Array.isArray(payload) || typeof transactionId !== 'string'
      || !/^[A-Za-z0-9_-]{1,128}$/.test(transactionId)
      || (payload.transaction_id !== undefined && payload.transaction_id !== transactionId)) {
      return res.status(400).json({ ok: false, error: 'Identificadores invalidos.' });
    }
    // Nullable external_id is documented. Resolve using the stored transaction instead.
    // Event status and amount are never trusted; fetch the provider's current state.
    const result = await verifyPurchase(payload.external_id ?? undefined, transactionId);
    return res.status(200).json({ ok: true, status: result.status });
  } catch (error) {
    console.error('Erro no webhook ConnectPay:', error);
    return res.status(error.statusCode === 404 ? 503 : error.statusCode || 502)
      .json({ ok: false, error: 'Nao foi possivel validar o pagamento.' });
  }
}
