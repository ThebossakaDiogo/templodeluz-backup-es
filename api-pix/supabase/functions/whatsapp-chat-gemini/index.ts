// @ts-nocheck
import {
  chatClient, cleanText, evolutionMessageId, requestProfile, sendEvolutionMessage, timingSafeEqual,
} from '../_shared/whatsapp-chat.ts';

const PROFILE_ORIGIN = 'original';
const DEFAULT_GEMINI_MODEL = 'gemini-3.0-flash';

function internalAuthorized(request: Request) {
  return timingSafeEqual(
    request.headers.get('x-whatsapp-chat-internal-token') ?? '',
    Deno.env.get('WHATSAPP_CHAT_INTERNAL_TOKEN') ?? '',
  );
}

async function generateReply(messages: Record<string, unknown>[], systemPrompt: string, instruction: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_CONFIGURATION_MISSING');
  const model = Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
  const contents = messages.map((message) => ({
    role: message.author_type === 'customer' ? 'user' : 'model',
    parts: [{ text: `${message.author_type === 'customer' ? 'Cliente' : 'Atendente'}: ${String(message.body ?? '')}` }],
  }));
  if (instruction) contents.push({ role: 'user', parts: [{ text: `Instrucao do atendente: ${instruction}` }] });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    signal: AbortSignal.timeout(35_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}`);
  const reply = cleanText(payload?.candidates?.[0]?.content?.parts?.map((part: Record<string, unknown>) => part.text).join(''), 4000);
  if (!reply) throw new Error('GEMINI_EMPTY_RESPONSE');
  return { reply, model };
}

async function deliverAutomaticReply(supabase: ReturnType<typeof chatClient>, thread: Record<string, unknown>, body: string, model: string) {
  const { data: message, error: insertError } = await supabase.from('whatsapp_chat_messages').insert({
    thread_id: thread.id,
    profile_origin: PROFILE_ORIGIN,
    direction: 'outbound',
    author_type: 'ai',
    message_type: 'text',
    body,
    delivery_status: 'pending',
    provider_payload: { gemini_model: model },
  }).select('*').single();
  if (insertError || !message) throw insertError ?? new Error('AI_MESSAGE_INSERT_FAILED');
  try {
    const providerPayload = await sendEvolutionMessage(String(thread.customer_phone), body);
    const { error: updateError } = await supabase.from('whatsapp_chat_messages').update({
      provider_message_id: evolutionMessageId(providerPayload), delivery_status: 'sent', provider_payload: { gemini_model: model, evolution: providerPayload },
    }).eq('id', message.id);
    if (updateError) throw updateError;
  } catch (error) {
    await supabase.from('whatsapp_chat_messages').update({ delivery_status: 'failed' }).eq('id', message.id);
    throw error;
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  if (!internalAuthorized(request)) return Response.json({ error: 'Not found.' }, { status: 404 });

  try {
    const input = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!input || !requestProfile(input, PROFILE_ORIGIN)) return Response.json({ error: 'Invalid profile.' }, { status: 403 });
    const mode = cleanText(input.mode, 32);
    const threadId = cleanText(input.threadId, 64);
    if (!['draft', 'auto_reply'].includes(mode) || !threadId) return Response.json({ error: 'Invalid Gemini request.' }, { status: 400 });

    const supabase = chatClient();
    const { data: settings, error: settingsError } = await supabase.from('whatsapp_chat_settings').select('*')
      .eq('profile_origin', PROFILE_ORIGIN).single();
    if (settingsError) throw settingsError;
    if (!settings.ai_enabled || (mode === 'auto_reply' && !settings.automation_enabled)) {
      return Response.json({ error: 'AI automation is disabled.' }, { status: 409 });
    }
    const { data: thread, error: threadError } = await supabase.from('whatsapp_chat_threads').select('*')
      .eq('id', threadId).eq('profile_origin', PROFILE_ORIGIN).maybeSingle();
    if (threadError) throw threadError;
    if (!thread) return Response.json({ error: 'Thread not found.' }, { status: 404 });
    const { data: messages, error: messagesError } = await supabase.from('whatsapp_chat_messages').select('author_type, body, created_at')
      .eq('thread_id', threadId).eq('profile_origin', PROFILE_ORIGIN).order('created_at', { ascending: false }).limit(20);
    if (messagesError) throw messagesError;
    const { reply, model } = await generateReply([...(messages ?? [])].reverse(), settings.ai_system_prompt, cleanText(input.instruction, 1000));
    if (mode === 'auto_reply') await deliverAutomaticReply(supabase, thread, reply, model);
    const { data: run, error: runError } = await supabase.from('whatsapp_chat_ai_runs').insert({
      profile_origin: PROFILE_ORIGIN, thread_id: threadId, status: mode === 'auto_reply' ? 'sent' : 'draft', summary: reply,
    }).select('*').single();
    if (runError) throw runError;
    return Response.json({ data: { reply, model, delivered: mode === 'auto_reply', run } });
  } catch (error) {
    console.error('whatsapp-chat-gemini', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Gemini response failed.' }, { status: 500 });
  }
});
