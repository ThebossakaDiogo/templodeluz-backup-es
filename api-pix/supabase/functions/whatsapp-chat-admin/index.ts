// @ts-nocheck
import {
  chatClient, cleanPhone, cleanText, cors, evolutionMessageId, isDashboardOrigin,
  ensureEvolutionInstance, evolutionConnectionStatus, json, projectChatProfile, requestProfile,
  requireDashboardAdmin, sendEvolutionMessage,
} from '../_shared/whatsapp-chat.ts';

const PROFILE_ORIGIN = projectChatProfile();

async function callGemini(payload: Record<string, unknown>) {
  const url = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const token = Deno.env.get('WHATSAPP_CHAT_INTERNAL_TOKEN');
  if (!url || !token) throw new Error('CHAT_INTERNAL_CONFIGURATION_MISSING');
  const response = await fetch(`${url}/functions/v1/whatsapp-chat-gemini`, {
    method: 'POST',
    signal: AbortSignal.timeout(45_000),
    headers: { 'Content-Type': 'application/json', 'x-whatsapp-chat-internal-token': token },
    body: JSON.stringify({ ...payload, profileOrigin: PROFILE_ORIGIN }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}`);
  return body;
}

async function sendMessage(supabase: ReturnType<typeof chatClient>, input: Record<string, unknown>) {
  const threadId = cleanText(input.threadId, 64);
  const body = cleanText(input.body);
  const messageType = cleanText(input.messageType, 32) || 'text';
  const mediaUrl = cleanText(input.mediaUrl, 2048) || null;
  if (!threadId || (!body && !mediaUrl) || !['text', 'image', 'video', 'audio', 'document'].includes(messageType)) {
    return { error: 'Mensagem invalida.', status: 400 };
  }
  if (mediaUrl && !/^https:\/\/[^\s]+$/i.test(mediaUrl)) return { error: 'URL de midia invalida.', status: 400 };

  const { data: thread, error: threadError } = await supabase
    .from('whatsapp_chat_threads')
    .select('id, customer_phone')
    .eq('id', threadId).eq('profile_origin', PROFILE_ORIGIN).maybeSingle();
  if (threadError) throw threadError;
  if (!thread) return { error: 'Conversa nao encontrada.', status: 404 };

  const { data: message, error: insertError } = await supabase.from('whatsapp_chat_messages').insert({
    thread_id: thread.id,
    profile_origin: PROFILE_ORIGIN,
    direction: 'outbound',
    author_type: 'admin',
    message_type: messageType,
    body,
    media_url: mediaUrl,
    delivery_status: 'pending',
  }).select('*').single();
  if (insertError || !message) throw insertError ?? new Error('MESSAGE_INSERT_FAILED');

  try {
    const providerPayload = await sendEvolutionMessage(thread.customer_phone, body, mediaUrl);
    const { data: delivered, error: updateError } = await supabase.from('whatsapp_chat_messages').update({
      provider_message_id: evolutionMessageId(providerPayload), delivery_status: 'sent', provider_payload: providerPayload,
    }).eq('id', message.id).select('*').single();
    if (updateError) throw updateError;
    return { data: delivered };
  } catch (error) {
    await supabase.from('whatsapp_chat_messages').update({ delivery_status: 'failed' }).eq('id', message.id);
    return { error: 'Nao foi possivel enviar a mensagem.', status: 502 };
  }
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') ?? '';
  if (request.method === 'OPTIONS') return isDashboardOrigin(origin)
    ? new Response(null, { status: 204, headers: cors(origin) })
    : new Response('Forbidden', { status: 403 });
  if (request.method !== 'POST') return json(origin, { error: 'Metodo nao permitido.' }, 405);
  if (!isDashboardOrigin(origin)) return json(origin, { error: 'Origem nao autorizada.' }, 403);
  if (!(await requireDashboardAdmin(request))) return json(origin, { error: 'Administrador nao autorizado.' }, 403);

  try {
    const input = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!input || !requestProfile(input, PROFILE_ORIGIN)) return json(origin, { error: 'Perfil nao autorizado.' }, 403);
    const action = cleanText(input.action, 64);
    const supabase = chatClient();

    if (action === 'evolution_status') {
      try {
        return json(origin, { data: await evolutionConnectionStatus() });
      } catch (error) {
        return json(origin, { data: { configured: false, connected: false, state: 'configuration_missing', error: error instanceof Error ? error.message : 'EVOLUTION_STATUS_FAILED' } });
      }
    }
    if (action === 'evolution_connect') {
      return json(origin, { data: await ensureEvolutionInstance() });
    }

    // Compatibility contract consumed by the dashboard inbox.
    if (action === 'list_messages') {
      const threadId = cleanText(input.thread_id ?? input.threadId, 64);
      const { data, error } = await supabase.from('whatsapp_chat_messages').select('*').eq('thread_id', threadId)
        .eq('profile_origin', PROFILE_ORIGIN).order('created_at', { ascending: true }).limit(Math.min(Number(input.limit) || 100, 500));
      if (error) throw error;
      await supabase.from('whatsapp_chat_threads').update({ unread_count: 0 }).eq('id', threadId).eq('profile_origin', PROFILE_ORIGIN);
      return json(origin, { data: { messages: (data ?? []).map((message) => ({ ...message, direction: message.author_type === 'ai' ? 'ai' : message.direction, content: message.content ?? message.body, delivery_status: message.delivery_status === 'pending' ? 'queued' : message.delivery_status })) } });
    }
    if (action === 'record_outgoing') {
      const threadId = cleanText(input.thread_id ?? input.threadId, 64); const content = cleanText(input.content, 4000);
      const messageType = cleanText(input.message_type, 32) || 'text';
      if (!threadId || !['text', 'image', 'document', 'audio'].includes(messageType)) return json(origin, { error: 'Mensagem invalida.' }, 400);
      const { data, error } = await supabase.from('whatsapp_chat_messages').insert({ thread_id: threadId, profile_origin: PROFILE_ORIGIN, remote_message_id: cleanText(input.remote_message_id, 255) || null, direction: 'outbound', author_type: 'admin', message_type: messageType, body: content, content, media_url: cleanText(input.media_url, 2048) || null, delivery_status: 'sent', provider_payload: { material_id: input.material_id ?? null } }).select('*').single();
      if (error) throw error; return json(origin, { data });
    }
    if (action === 'list_materials') {
      const query = cleanText(input.query, 120); let request = supabase.from('whatsapp_chat_materials').select('*').eq('profile_origin', PROFILE_ORIGIN).eq('is_active', true).order('created_at', { ascending: false });
      if (query) request = request.ilike('name', `%${query.replace(/[%_]/g, '')}%`);
      const { data, error } = await request; if (error) throw error; return json(origin, { data: { materials: data ?? [] } });
    }
    if (action === 'upload_material') {
      const name = cleanText(input.name, 180); const mimeType = cleanText(input.mime_type, 120) || 'application/octet-stream'; const source = cleanText(input.content_base64, 10_000_000);
      if (!name || !source) return json(origin, { error: 'Material invalido.' }, 400);
      const bytes = Uint8Array.from(atob(source), (character) => character.charCodeAt(0)); if (bytes.byteLength > 7_000_000) return json(origin, { error: 'Material excede 7 MB.' }, 400);
      const path = `${PROFILE_ORIGIN}/${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: storageError } = await supabase.storage.from('whatsapp-chat-materials').upload(path, bytes, { contentType: mimeType, upsert: false }); if (storageError) throw storageError;
      const { data, error } = await supabase.from('whatsapp_chat_materials').insert({ profile_origin: PROFILE_ORIGIN, name, mime_type: mimeType, size_bytes: bytes.byteLength, storage_path: path, category: cleanText(input.category, 80) || null, description: cleanText(input.description, 500) || null }).select('*').single(); if (error) throw error; return json(origin, { data });
    }
    if (action === 'prepare_material') {
      const { data: material, error } = await supabase.from('whatsapp_chat_materials').select('*').eq('id', cleanText(input.material_id, 64)).eq('profile_origin', PROFILE_ORIGIN).eq('is_active', true).maybeSingle(); if (error) throw error; if (!material) return json(origin, { error: 'Material nao encontrado.' }, 404);
      const { data: signed, error: signError } = await supabase.storage.from('whatsapp-chat-materials').createSignedUrl(material.storage_path, 600); if (signError) throw signError; return json(origin, { data: { signed_url: signed.signedUrl, caption: material.description || material.name } });
    }
    if (action === 'list_ai_runs') { const { data, error } = await supabase.from('whatsapp_chat_ai_runs').select('*').eq('thread_id', cleanText(input.thread_id ?? input.threadId, 64)).eq('profile_origin', PROFILE_ORIGIN).order('created_at', { ascending: false }).limit(30); if (error) throw error; return json(origin, { data: { runs: data ?? [] } }); }
    if (action === 'get_ai_settings') { const { data, error } = await supabase.from('whatsapp_chat_settings').select('*').eq('profile_origin', PROFILE_ORIGIN).single(); if (error) throw error; return json(origin, { data: { enabled: data.ai_enabled && data.automation_enabled, brand_instructions: data.ai_system_prompt, tone: 'acolhedor e objetivo', away_message: null, response_window_minutes: 15, message_limit: 3, updated_at: data.updated_at } }); }
    if (action === 'update_ai_settings') { const settings = (input.settings && typeof input.settings === 'object' ? input.settings : {}) as Record<string, unknown>; const patch: Record<string, unknown> = {}; if (typeof settings.enabled === 'boolean') { patch.ai_enabled = settings.enabled; patch.automation_enabled = settings.enabled; } if (typeof settings.brand_instructions === 'string') patch.ai_system_prompt = cleanText(settings.brand_instructions, 4000); if (!Object.keys(patch).length) return json(origin, { error: 'Configuracao de IA invalida.' }, 400); const { data, error } = await supabase.from('whatsapp_chat_settings').update(patch).eq('profile_origin', PROFILE_ORIGIN).select('*').single(); if (error) throw error; return json(origin, { data: { enabled: data.ai_enabled && data.automation_enabled, brand_instructions: data.ai_system_prompt, tone: 'acolhedor e objetivo', away_message: null, response_window_minutes: 15, message_limit: 3, updated_at: data.updated_at } }); }

    if (action === 'list_threads') {
      const limit = Math.min(Math.max(Number(input.limit) || 100, 1), 200);
      let query = supabase.from('whatsapp_chat_threads').select('*').eq('profile_origin', PROFILE_ORIGIN);
      const status = cleanText(input.status, 32); const search = cleanText(input.query, 120).replace(/[%_]/g, '');
      if (status && ['open', 'resolved', 'opted_out'].includes(status)) query = query.eq('status', status);
      if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
      const { data, error } = await query.order('last_message_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return json(origin, { data: { threads: data ?? [], next_cursor: null } });
    }
    if (action === 'get_thread') {
      const threadId = cleanText(input.thread_id ?? input.threadId, 64);
      const { data: thread, error: threadError } = await supabase.from('whatsapp_chat_threads').select('*')
        .eq('id', threadId).eq('profile_origin', PROFILE_ORIGIN).maybeSingle();
      if (threadError) throw threadError;
      if (!thread) return json(origin, { error: 'Conversa nao encontrada.' }, 404);
      const { data: messages, error: messagesError } = await supabase.from('whatsapp_chat_messages').select('*')
        .eq('thread_id', threadId).eq('profile_origin', PROFILE_ORIGIN).order('created_at', { ascending: true }).limit(500);
      if (messagesError) throw messagesError;
      await supabase.from('whatsapp_chat_threads').update({ unread_count: 0 }).eq('id', threadId).eq('profile_origin', PROFILE_ORIGIN);
      return json(origin, { data: { ...thread, unread_count: 0, messages: messages ?? [] } });
    }
    if (action === 'create_thread') {
      const customerPhone = cleanPhone(input.customerPhone);
      const customerName = cleanText(input.customerName, 120) || null;
      if (!customerPhone) return json(origin, { error: 'Telefone invalido.' }, 400);
      const { data, error } = await supabase.from('whatsapp_chat_threads').upsert({
        profile_origin: PROFILE_ORIGIN, customer_phone: customerPhone, customer_name: customerName,
      }, { onConflict: 'profile_origin,customer_phone' }).select('*').single();
      if (error) throw error;
      return json(origin, { data });
    }
    if (action === 'update_thread') {
      const threadId = cleanText(input.threadId, 64);
      const status = cleanText(input.status, 16);
      if (!['open', 'resolved', 'opted_out'].includes(status)) return json(origin, { error: 'Status invalido.' }, 400);
      const { data, error } = await supabase.from('whatsapp_chat_threads').update({ status })
        .eq('id', threadId).eq('profile_origin', PROFILE_ORIGIN).select('*').maybeSingle();
      if (error) throw error;
      return data ? json(origin, { data }) : json(origin, { error: 'Conversa nao encontrada.' }, 404);
    }
    if (action === 'send_message') {
      const result = await sendMessage(supabase, input);
      return result.error ? json(origin, { error: result.error }, result.status) : json(origin, result);
    }
    if (action === 'get_settings') {
      const { data, error } = await supabase.from('whatsapp_chat_settings').select('*').eq('profile_origin', PROFILE_ORIGIN).single();
      if (error) throw error;
      return json(origin, { data });
    }
    if (action === 'update_settings') {
      const patch: Record<string, unknown> = {};
      if (typeof input.aiEnabled === 'boolean') patch.ai_enabled = input.aiEnabled;
      if (typeof input.automationEnabled === 'boolean') patch.automation_enabled = input.automationEnabled;
      if (typeof input.aiSystemPrompt === 'string') patch.ai_system_prompt = cleanText(input.aiSystemPrompt, 4000);
      if (Object.keys(patch).length === 0) return json(origin, { error: 'Nenhuma configuracao valida.' }, 400);
      if (patch.automation_enabled === true && patch.ai_enabled === false) return json(origin, { error: 'Automacao exige IA habilitada.' }, 400);
      const { data, error } = await supabase.from('whatsapp_chat_settings').update(patch)
        .eq('profile_origin', PROFILE_ORIGIN).select('*').single();
      if (error) throw error;
      return json(origin, { data });
    }
    if (action === 'generate_draft') {
      const threadId = cleanText(input.thread_id ?? input.threadId, 64);
      if (!threadId) return json(origin, { error: 'Conversa invalida.' }, 400);
      const result = await callGemini({ mode: 'draft', threadId, instruction: cleanText(input.instruction, 1000) });
      return json(origin, { data: { draft: result?.data?.reply ?? '', run: result?.data?.run ?? null } });
    }
    return json(origin, { error: 'Operacao desconhecida.' }, 400);
  } catch (error) {
    console.error('whatsapp-chat-admin', error instanceof Error ? error.message : error);
    return json(origin, { error: 'Falha no chat administrativo.' }, 500);
  }
});
