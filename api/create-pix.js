import crypto from 'node:crypto';
import { isIP } from 'node:net';

const PRODUCT_CATALOG = Object.freeze({
  reading_15: { amount: 15, title: 'Leitura Amorosa Essencial', description: '3 respostas e leitura amorosa imediata', questions: 3, oraculo_days: 0, has_amarracao: false },
  reading_25: { amount: 25, title: 'Leitura Amorosa com Oráculo', description: '5 respostas e 30 dias de oráculo', questions: 5, oraculo_days: 30, has_amarracao: false },
  reading_35: { amount: 35, title: 'Amarração Amorosa com 5 Respostas', description: '5 respostas e amarração amorosa', questions: 5, oraculo_days: 30, has_amarracao: true },
  reading_45: { amount: 45, title: 'Amarração Amorosa com Leitura da Mão', description: '5 respostas e amarração amorosa', questions: 5, oraculo_days: 30, has_amarracao: true, has_hand_reading: true },
  reading_55: { amount: 55, title: 'Leitura Completa com Terceira Pessoa', description: '5 respostas e revelação de rivais', questions: 5, oraculo_days: 60, has_amarracao: true, has_hand_reading: true, has_rival_reading: true },
  reading_60: { amount: 60, title: 'Pacote Sagrado VIP - Tudo Incluso', description: 'Tudo incluso com prioridade máxima e oráculo 90 dias', questions: 5, oraculo_days: 90, has_amarracao: true, has_hand_reading: true },
  premium_video_150: { amount: 150, title: 'Leitura Amorosa Premium - 3 sessões com videochamada', description: '3 sessões pelo WhatsApp, leitura da mão por videochamada, 5 perguntas, cartas amorosas, oráculo de 90 dias e amarração de 3 a 7 dias', questions: 5, oraculo_days: 90, has_amarracao: true, has_videochamada: true, sessions: 3 },
  answers_3_20: { amount: 20, title: '3 Respostas Adicionais', description: '3 respostas adicionais com as cartas', questions: 3, purpose: 'respostas_extra' },
  answers_5_30: { amount: 30, title: '5 Respostas + Oráculo', description: '5 respostas adicionais e abertura do oráculo', questions: 5, oraculo_days: 30, purpose: 'respostas_extra' },
  oracle_30_days_30: { amount: 30, title: '5 Respostas + Oráculo de 30 Dias', description: '5 respostas e previsão amorosa para os próximos 30 dias', questions: 5, oraculo_days: 30, purpose: 'oraculo_30' },
  oracle_90_days_30: { amount: 30, title: 'Oráculo Amoroso de 90 Dias', description: 'Previsão amorosa para os próximos 90 dias', oraculo_days: 90, purpose: 'oraculo_90' },
  binding_40: { amount: 40, title: 'Amarração e Firmeza Amorosa', description: 'Orientação espiritual de aproximação de 3 a 7 dias', has_amarracao: true, purpose: 'amarracao' },
  donation_10: { amount: 10, title: 'Contribuição ao Templo', description: 'Contribuição voluntária ao Templo da Luz Amorosa', purpose: 'doacao' },
  donation_15: { amount: 15, title: 'Contribuição ao Templo', description: 'Contribuição voluntária ao Templo da Luz Amorosa', purpose: 'doacao' },
});

function resolveProduct(body) {
  const productId = String(body.product_id || '').trim();
  const product = Object.hasOwn(PRODUCT_CATALOG, productId) ? PRODUCT_CATALOG[productId] : null;
  const requestedAmount = body.amount;

  if (!product || !Number.isFinite(requestedAmount) || requestedAmount !== product.amount) {
    return null;
  }

  return { productId, product: { product_id: productId, ...product } };
}

export function purchasedPackage(order) {
  // Existing paid orders predate product_id. Resolve only known prices, never client benefits.
  const amount = Number(order?.amount);
  const id = order?.package?.product_id || (amount === 150 ? 'premium_video_150' : `reading_${amount}`);
  const product = Object.hasOwn(PRODUCT_CATALOG, id) ? PRODUCT_CATALOG[id] : null;
  return product && product.amount === amount ? { product_id: id, ...product } : null;
}

async function fetchWithTimeout(url, options, timeoutMs = 10000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do serviço externo (HTTP ${response.status}).`);
  }
}

function secureRandomDigits(length = 4) {
  const min = 10 ** (length - 1);
  const max = (10 ** length) - 1;
  return String(crypto.randomInt(min, max + 1));
}

function formatCustomerName(rawName, phone) {
  const clean = String(rawName || '').trim().replace(/[^\p{L}\s]/gu, '').slice(0, 160);
  if (clean) {
    return clean;
  }
  const phoneDigits = (phone || '').replace(/\D/g, '');
  const phoneSuffix = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : secureRandomDigits(4);
  return `Cliente ${phoneSuffix}`;
}

function generateValidCpf(seed) {
  const clean = (seed || '').replace(/\D/g, '');
  const baseDigits = (clean + Date.now().toString() + '789123456').slice(0, 9).split('').map(Number);

  let sum1 = 0;
  for (let i = 0; i < 9; i++) sum1 += baseDigits[i] * (10 - i);
  const mod1 = sum1 % 11;
  const d1 = (11 - mod1) >= 10 ? 0 : (11 - mod1);

  let sum2 = 0;
  for (let i = 0; i < 9; i++) sum2 += baseDigits[i] * (11 - i);
  sum2 += d1 * 2;
  const mod2 = sum2 % 11;
  const d2 = (11 - mod2) >= 10 ? 0 : (11 - mod2);

  return [...baseDigits, d1, d2].join('');
}

function resolveClientIp(req) {
  const fallbackIp = process.env.FALLBACK_CLIENT_IP || ['177', '100', '100', '100'].join('.');
  const raw = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress;
  if (typeof raw !== 'string') {
    return fallbackIp;
  }

  const clientIp = raw.split(',')[0].trim();
  const isValidIp = isIP(clientIp) !== 0;
  const isLocal = clientIp === '127.0.0.1' || clientIp === '::1';

  return (isValidIp && !isLocal) ? clientIp : fallbackIp;
}

function resolveCustomer(body) {
  const rawPhone = String(body.phone || '').replace(/\D/g, '');
  const phone = rawPhone.length >= 10 ? rawPhone : `119${secureRandomDigits(8)}`;
  const customerName = formatCustomerName(body.name, phone);
  const rawDoc = String(body.document || body.cpf || '').replace(/\D/g, '');
  const document = rawDoc.length === 11 ? rawDoc : generateValidCpf(phone);
  const email = body.email ? String(body.email).trim() : `cliente_${phone.slice(-9)}_${Date.now().toString().slice(-4)}@templodaluz.larequilibrado.com`;

  return { phone, customerName, document, email };
}

async function recordOrderInSupabase(orderData) {
  const supaUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) {
    throw new Error('Supabase não configurado para registrar pedidos.');
  }

  const response = await fetchWithTimeout(`${supaUrl}/rest/v1/orders?on_conflict=external_id`, {
    method: 'POST',
    headers: {
      'apikey': supaKey,
      'Authorization': `Bearer ${supaKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([orderData]),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Não foi possível registrar o pedido (HTTP ${response.status}): ${details}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  }

  try {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ ok: false, error: 'JSON inválido.' });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'Dados inválidos.' });
    }
    const resolved = resolveProduct(body);

    if (!resolved) {
      return res.status(400).json({ ok: false, error: 'Produto ou valor inválido.' });
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, error: 'Supabase não configurado para registrar pedidos.' });
    }

    const { productId, product: packageData } = resolved;
    const amount = packageData.amount;
    const { phone, customerName, document, email } = resolveCustomer(body);
    const ente = String(body.ente || '').trim();
    const letter = String(body.letter || '').trim();
    const tracking = body.tracking || {};

    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const externalId = `tdl_${Date.now()}_${randomSuffix}`;
    const webhookUrl = String(process.env.CONNECTPAY_WEBHOOK_URL || '');
    if (!webhookUrl.startsWith('https://')) {
      return res.status(500).json({ ok: false, error: 'CONNECTPAY_WEBHOOK_URL não configurado com HTTPS.' });
    }
    const clientIp = resolveClientIp(req);

    const payload = {
      external_id: externalId,
      total_amount: Math.round(amount * 100) / 100,
      payment_method: 'PIX',
      webhook_url: webhookUrl,
      ip: clientIp,
      items: [{
        id: productId,
        title: packageData.title,
        description: packageData.description || 'Leitura de tarot espiritual',
        price: Math.round(amount * 100) / 100,
        quantity: 1,
        is_physical: false,
      }],
      customer: {
        name: customerName,
        email,
        phone,
        document_type: 'CPF',
        document,
      },
    };

    const secret = process.env.CONNECTPAY_API_SECRET;
    if (!secret) {
      return res.status(500).json({ ok: false, error: 'CONNECTPAY_API_SECRET não configurado.' });
    }

    const cpRes = await fetchWithTimeout('https://api.connectpay.vc/v1/transactions', {
      method: 'POST',
      headers: {
        'api-secret': secret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let rawApi;
    try {
      rawApi = await readJsonResponse(cpRes);
    } catch {
      return res.status(502).json({ ok: false, error: 'A ConnectPay retornou uma resposta inválida.' });
    }
    if (!rawApi || typeof rawApi !== 'object') {
      return res.status(502).json({ ok: false, error: 'A ConnectPay retornou uma resposta inválida.' });
    }
    const api = rawApi.data || rawApi;
    if (!cpRes.ok || rawApi.success === false || rawApi.hasError || api.hasError) {
      return res.status(502).json({
        ok: false,
        error: api.error?.message || (typeof api.message === 'string' ? api.message : '') || 'A ConnectPay recusou a criação do PIX.',
      });
    }

    const pixPayload = api.pix?.payload || api.payload || api.pix_payload || api.qr_code || '';
    const transactionId = api.id || api.transaction_id || '';
    const status = api.status || 'PENDING';

    if (typeof pixPayload !== 'string' || !pixPayload || typeof transactionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(transactionId)) {
      return res.status(502).json({ ok: false, error: 'A ConnectPay não retornou o PIX esperado.' });
    }

    await recordOrderInSupabase({
      external_id: externalId,
      transaction_id: transactionId,
      status,
      amount: Math.round(amount * 100) / 100,
      payment_method: 'PIX',
      name: customerName,
      phone,
      email,
      document,
      ente,
      letter,
      package_title: packageData.title,
      package_description: packageData.description,
      package: packageData,
      tracking,
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      external_id: externalId,
      transaction_id: transactionId,
      status,
      amount: Math.round(amount * 100) / 100,
      product_id: productId,
      pix_payload: pixPayload,
    });
  } catch (err) {
    console.error('Erro em create-pix:', err);
    return res.status(502).json({ ok: false, error: 'Não foi possível concluir o PIX. Tente novamente mais tarde.' });
  }
}
