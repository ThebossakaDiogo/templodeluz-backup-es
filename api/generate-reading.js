import { verifyPurchase } from './check-purchase.js';
import { purchasedPackage } from './create-pix.js';

function cleanText(value, maxLength = 1000) {
  return String(value || '').trim().slice(0, maxLength);
}

async function verifyPaidOrder(orderId) {
  const order = await verifyPurchase(orderId);
  return order.paid ? purchasedPackage(order) : null;
}

function buildPrompt(mode, data) {
  const nome = cleanText(data.nome, 100) || 'Cliente';
  const ente = cleanText(data.ente, 100) || 'Pessoa Amada';
  const relacao = cleanText(data.parentesco || data.afastamento, 500) || 'relação amorosa';

  if (mode === 'oracle') {
    const days = [30, 60, 90].includes(Number(data.oraculoDays)) ? Number(data.oraculoDays) : 30;
    const amor = cleanText(data.oraculo_amor, 1000);
    const desejo = cleanText(data.oraculo_financas, 1000);
    const sinal = cleanText(data.oraculo_familia, 1000);
    const binding = data.hasAmarracao
      ? "Inclua ao final uma seção 'Os 3 passos do amor' como orientação espiritual, sem promessa garantida."
      : 'Não mencione amarração; foque em sinais, postura e caminhos.';
    return {
      maxTokens: 1000,
      outputKey: 'leitura',
      content: `Você é Milena Medeiros, taróloga e oraculista amorosa. Faça uma leitura espiritual dos próximos ${days} dias para ${nome}. Medo principal: '${amor}'. Desejo para a relação: '${desejo}'. Sinal que deseja entender: '${sinal}'. Responda aos dados informados com parágrafos curtos, tom firme, místico e esperançoso. ${binding} Finalize com uma orientação prática para hoje.`,
    };
  }

  if (mode === 'answer') {
    const question = cleanText(data.mensagem_upsell, 1500);
    return {
      maxTokens: 400,
      outputKey: 'resposta',
      content: `Você é Milena Medeiros, taróloga amorosa. Responda em até 2 parágrafos, de forma personalizada e direta, à pergunta de ${nome} sobre ${ente}. Situação: '${relacao}'. Pergunta: '${question}'. Interprete como uma abertura rápida de cartas, citando sentimento, bloqueio e uma orientação prática para 24 a 48 horas. Não prometa resultado e não afirme traição como fato.`,
    };
  }

  const message = cleanText(data.mensagem, 2000) || 'Nenhuma mensagem específica';
  return {
    maxTokens: 1000,
    outputKey: 'carta',
    content: `Você é Milena Medeiros, taróloga espiritualista especializada em amor. Faça uma leitura íntima para ${nome} sobre ${ente}. Situação: '${relacao}'. Mensagem principal: '${message}'. Responda diretamente ao contexto com parágrafos curtos: sentimento atual, bloqueio oculto, possível influência externa, caminho de aproximação e orientação para as próximas 48 horas. Não prometa resultado e não afirme traição como fato. Finalize como Taróloga Milena.`,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  }

  try {
    let data;
    try { data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({ ok: false, error: 'JSON invalido.' }); }
    if (!data || typeof data !== 'object' || Array.isArray(data) || !['letter', 'oracle', 'answer'].includes(data.mode)) {
      return res.status(400).json({ ok: false, error: 'Dados de leitura invalidos.' });
    }
    const orderId = cleanText(data.order_id, 128);
    const order = await verifyPaidOrder(orderId);
    if (!order) {
      return res.status(403).json({ ok: false, error: 'Pagamento não confirmado para esta leitura.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY não configurada.' });
    }

    const mode = data.mode;
    if ((mode === 'oracle' && !order.oraculo_days)
      || (mode === 'answer' && !order.questions)
      || (mode === 'letter' && !order.product_id.startsWith('reading_') && order.product_id !== 'premium_video_150')) {
      return res.status(403).json({ ok: false, error: 'O pacote nao inclui esta leitura.' });
    }
    const prompt = buildPrompt(mode, { ...data, oraculoDays: order.oraculo_days, hasAmarracao: Boolean(order.has_amarracao) });
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt.content }],
        temperature: 0.7,
        max_tokens: prompt.maxTokens,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const rawText = await openAiResponse.text();
    let responseData = {};
    try {
      responseData = rawText ? JSON.parse(rawText) : {};
    } catch {
      return res.status(502).json({ ok: false, error: 'A IA retornou uma resposta inválida.' });
    }
    if (!openAiResponse.ok) {
      return res.status(502).json({ ok: false, error: responseData.error?.message || 'Não foi possível gerar a leitura.' });
    }

    const content = responseData.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(502).json({ ok: false, error: 'A IA não retornou conteúdo para a leitura.' });
    }
    return res.status(200).json({ ok: true, [prompt.outputKey]: content });
  } catch (error) {
    console.error('Erro ao gerar leitura:', error);
    return res.status(error.statusCode || 502).json({ ok: false, error: 'Nao foi possivel validar ou gerar a leitura. Tente novamente.' });
  }
}
