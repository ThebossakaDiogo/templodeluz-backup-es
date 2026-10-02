function text(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Metodo nao permitido.' });

  try {
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({ ok: false, error: 'JSON invalido.' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'Evento invalido.' });
    }

    const sessionId = text(body.sessionId || body.session_id, 128);
    const eventType = text(body.eventType || body.event_type || body.type, 80);
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(sessionId) || !eventType) {
      return res.status(400).json({ ok: false, error: 'Sessao ou evento invalido.' });
    }

    const supaUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !supaKey) return res.status(500).json({ ok: false, error: 'Analytics nao configurado.' });

    const forwarded = text(req.headers['x-forwarded-for'] || req.headers['x-real-ip'], 200).split(',')[0].trim();
    const record = {
      session_id: sessionId,
      event_type: eventType,
      page: text(body.page || body.path, 1000),
      title: text(body.title, 200),
      step: text(body.step, 160),
      label: text(body.label, 200),
      value: text(body.value, 300),
      referrer: text(body.referrer, 1000),
      utm_source: text(body.utm_source, 160),
      utm_medium: text(body.utm_medium, 160),
      utm_campaign: text(body.utm_campaign, 200),
      user_agent: text(req.headers['user-agent'], 500),
      client_ip: forwarded || null,
    };
    const response = await fetch(`${supaUrl}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro no analytics:', error);
    return res.status(502).json({ ok: false, error: 'Nao foi possivel salvar o evento.' });
  }
}
