// @ts-nocheck
import {
  chatClient, cleanPhone, cleanText, evolutionMessageId, requestProfile, timingSafeEqual,
} from '../_shared/whatsapp-chat.ts';

const PROFILE_ORIGIN = 'original';

function webhookToken(request: Request) {
  return request.headers.get('x-evolution-webhook-token')
    ?? new URL(request.url).searchParams.get('token')
    ?? '';
}

function eventData(payload: Record<string, unknown>) {
  return (payload.data && typeof payload.data === 'object' ? payload.data : payload) as Record<string, unknown>;
}

function inboundMessage(data: Record<string, unknown>) {
  const key = (data.key && typeof data.key === 'object' ? data.key : {}) as Record<string, unknown>;
  const message = (data.message && typeof data.message === 'object' ? data.message : {}) as Record<string, unknown>;
  const extended = (message.extendedTextMessage && typeof message.extendedTextMessage === 'object'
    ? message.extendedTextMessage : {}) as Record<string, unknown>;
  const image = (message.imageMessage && typeof message.imageMessage === 'object' ? message.imageMessage : {}) as Record<string, unknown>;
  const video = (message.videoMessage && typeof message.videoMessage === 'object' ? message.videoMessage : {}) as Record<string, unknown>;
  const document = (message.documentMessage && typeof message.documentMessage === 'object' ? message.documentMessage : {}) as Record<string, unknown>;
  const audio = (message.audioMessage && typeof message.audioMessage === 'object' ? message.audioMessage : {}) as Record<string, unknown>;
  const remoteJid = String(key.remoteJid ?? data.remoteJid ?? data.from ?? '');
  const phone = cleanPhone(remoteJid.split('@')[0]);
  const providerMessageId = cleanText(key.id ?? data.id, 255);
  const body = cleanText(message.conversation ?? extended.text ?? image.caption ?? video.caption ?? document.caption, 4000);
  const messageType = image.mimetype ? 'image'
    : video.mimetype ? 'video'
      : document.mimetype ? 'document'
        : audio.mimetype ? 'audio' : 'text';
  return {
    phone,
    providerMessageId,
    body,
    messageType,
    fromMe: key.fromMe === true || data.fromMe === true,
    customerName: cleanText(data.pushName ?? data.senderName ?? data.notifyName, 120) || null,
  };
}

async function requestAutomaticReply(threadId: string) {
  const url = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const token = Deno.env.get('WHATSAPP_CHAT_INTERNAL_TOKEN');
  if (!url || !token) throw new Error('CHAT_INTERNAL_CONFIGURATION_MISSING');
  const response = await fetch(`${url}/functions/v1/whatsapp-chat-gemini`, {
    method: 'POST',
    signal: AbortSignal.timeout(45_000),
    headers: { 'Content-Type': 'application/json', 'x-whatsapp-chat-internal-token': token },
    body: JSON.stringify({ mode: 'auto_reply', threadId, profileOrigin: PROFILE_ORIGIN }),
  });
  if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}`);
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const expectedToken = Deno.env.get('EVOLUTION_WEBHOOK_TOKEN') ?? '';
  if (!timingSafeEqual(webhookToken(request), expectedToken)) return new Response('Not found', { status: 404 });

  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload || !requestProfile(payload, PROFILE_ORIGIN)) return Response.json({ error: 'Invalid chat payload.' }, { status: 400 });
    const data = eventData(payload);
    const configuredInstance = Deno.env.get('EVOLUTION_INSTANCE');
    const receivedInstance = cleanText(payload.instance ?? data.instance, 120);
    if (configuredInstance && receivedInstance && receivedInstance !== configuredInstance) {
      return Response.json({ error: 'Profile instance mismatch.' }, { status: 403 });
    }

    const event = cleanText(payload.event ?? data.event ?? 'messages.upsert', 80).toLowerCase();
    if (event && !event.includes('message')) return Response.json({ received: true, ignored: true });
    const inbound = inboundMessage(data);
    if (inbound.fromMe) return Response.json({ received: true, ignored: true });
    if (!inbound.phone || !inbound.providerMessageId || (!inbound.body && inbound.messageType === 'text')) {
      return Response.json({ error: 'Invalid inbound message.' }, { status: 400 });
    }

    const supabase = chatClient();
    const { data: existing, error: duplicateError } = await supabase.from('whatsapp_chat_messages')
      .select('id').eq('provider_message_id', inbound.providerMessageId).maybeSingle();
    if (duplicateError) throw duplicateError;
    if (existing) return Response.json({ received: true, duplicate: true });

    const { data: thread, error: threadError } = await supabase.from('whatsapp_chat_threads').upsert({
      profile_origin: PROFILE_ORIGIN,
      customer_phone: inbound.phone,
      customer_name: inbound.customerName,
      evolution_instance: receivedInstance || configuredInstance || null,
    }, { onConflict: 'profile_origin,customer_phone' }).select('*').single();
    if (threadError || !thread) throw threadError ?? new Error('THREAD_UPSERT_FAILED');

    const { error: messageError } = await supabase.from('whatsapp_chat_messages').insert({
      thread_id: thread.id,
      profile_origin: PROFILE_ORIGIN,
      provider_message_id: inbound.providerMessageId,
      direction: 'inbound',
      author_type: 'customer',
      message_type: inbound.messageType,
      body: inbound.body,
      delivery_status: 'received',
      provider_payload: payload,
    });
    if (messageError) {
      if (messageError.code === '23505') return Response.json({ received: true, duplicate: true });
      throw messageError;
    }

    const { data: settings, error: settingsError } = await supabase.from('whatsapp_chat_settings')
      .select('ai_enabled, automation_enabled').eq('profile_origin', PROFILE_ORIGIN).single();
    if (settingsError) throw settingsError;
    if (settings?.ai_enabled && settings?.automation_enabled && inbound.messageType === 'text') {
      // A failure to draft/respond must not make Evolution retry a stored inbound message.
      try {
        await requestAutomaticReply(thread.id);
      } catch (error) {
        console.error('whatsapp-chat-webhook automation', error instanceof Error ? error.message : error);
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('whatsapp-chat-webhook', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
});
