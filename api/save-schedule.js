import { verifyPurchase } from './check-purchase.js';
import { purchasedPackage } from './create-pix.js';

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  }

  try {
    const body = req.body || {};
    const orderId = cleanText(body.order_id, 128);
    const sessionId = cleanText(body.sessionId, 128);
    const day = cleanText(body.day, 100);
    const hour = cleanText(body.hour, 100);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(orderId) || !sessionId || !day || !hour) {
      return res.status(400).json({ ok: false, error: 'Dados de agendamento incompletos.' });
    }

    const supaUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !supaKey) {
      return res.status(500).json({ ok: false, error: 'Supabase não configurado.' });
    }

    const order = await verifyPurchase(orderId);
    const packageData = purchasedPackage(order);
    if (!order.paid || !packageData?.has_videochamada) {
      return res.status(403).json({ ok: false, error: 'O pedido não possui videochamada confirmada.' });
    }

    const scheduleResponse = await fetch(`${supaUrl}/rest/v1/consultation_schedules?on_conflict=external_id`, {
      method: 'POST',
      headers: {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{
        session_id: sessionId,
        external_id: order.external_id,
        name: cleanText(body.nome || order.name, 160),
        email: cleanText(body.email || order.email, 320),
        ente: cleanText(body.ente || order.ente, 160),
        package_amount: packageData.amount,
        package_title: cleanText(packageData.title, 240),
        preferred_day: day,
        preferred_hour: hour,
        updated_at: new Date().toISOString(),
      }]),
      signal: AbortSignal.timeout(8000),
    });
    if (!scheduleResponse.ok) {
      const details = (await scheduleResponse.text()).slice(0, 500);
      throw new Error(`Falha ao salvar agendamento (HTTP ${scheduleResponse.status}): ${details}`);
    }

    return res.status(200).json({ ok: true, saved: true });
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    return res.status(error.statusCode || 502).json({ ok: false, error: 'Nao foi possivel validar ou salvar o agendamento.' });
  }
}
