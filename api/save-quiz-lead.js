export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método não permitido. Utilize POST.' });
  }

  try {
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({ ok: false, saved: false, error: 'JSON invalido.' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ok: false, saved: false, error: 'Dados invalidos.' });
    }
    const {
      session_id = '',
      nome = '',
      ente = '',
      relacao = '',
      intencao = '',
      utm_source = '',
      utm_medium = '',
      utm_campaign = '',
      utm_content = '',
      utm_term = '',
      referrer = '',
    } = body;

    if (typeof session_id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(session_id)) {
      return res.status(400).json({ ok: false, error: 'session_id é obrigatório.' });
    }

    const userAgent = req.headers['user-agent'] || '';
    const supaUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supaUrl || !supaKey) {
      console.warn('[save-quiz-lead] Supabase não configurado. Lead recebido localmente.');
      return res.status(500).json({ ok: false, saved: false, error: 'Supabase não configurado.' });
    }

    const leadData = {
      session_id: String(session_id),
      nome: String(nome || '').trim(),
      ente: String(ente || '').trim(),
      relacao: String(relacao || '').trim(),
      intencao: String(intencao || '').trim(),
      utm_source: String(utm_source || ''),
      utm_medium: String(utm_medium || ''),
      utm_campaign: String(utm_campaign || ''),
      utm_content: String(utm_content || ''),
      utm_term: String(utm_term || ''),
      referrer: String(referrer || '').slice(0, 500),
      user_agent: String(userAgent).slice(0, 500),
    };

    const endpoint = `${supaUrl}/rest/v1/quiz_funnel_leads?on_conflict=session_id`;
    for (const key of Object.keys(leadData)) leadData[key] = leadData[key].slice(0, 500);
    const supaRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(leadData),
      signal: AbortSignal.timeout(8000),
    });

    if (!supaRes.ok) {
      const errorText = await supaRes.text();
      console.error('[save-quiz-lead] Erro ao salvar no Supabase:', supaRes.status, errorText);
      return res.status(502).json({ ok: false, saved: false, error: 'Nao foi possivel salvar os dados.' });
    }

    return res.status(200).json({ ok: true, saved: true });
  } catch (err) {
    console.error('[save-quiz-lead] Erro interno:', err);
    return res.status(502).json({ ok: false, saved: false, error: 'Nao foi possivel salvar os dados.' });
  }
}
