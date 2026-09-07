// @ts-nocheck
const DEFAULT_META_PIXEL_ID = '1076049174870131';
const DEFAULT_GRAPH_API_VERSION = 'v23.0';
const DEFAULT_EVENT_SOURCE_URL = 'https://templodeluz.com/';

function cleanText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeText(value: unknown) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value: unknown) {
  const phone = cleanText(value).replace(/\D/g, '');
  if (!phone) return '';
  if (phone.length === 10 || phone.length === 11) return `55${phone}`;
  return phone.length === 12 || phone.length === 13 ? phone : '';
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashedArray(value: string) {
  return value ? [await sha256(value)] : undefined;
}

function eventTimestamp(value: unknown) {
  const parsed = new Date(cleanText(value));
  const timestamp = Math.floor(parsed.getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  return Number.isFinite(timestamp) && timestamp > 0 ? Math.min(timestamp, now) : now;
}

async function buildUserData(order: Record<string, any>) {
  const fullName = cleanText(order.customer_name);
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = normalizeText(nameParts[0]);
  const lastName = normalizeText(nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
  const email = normalizeEmail(order.customer_email);
  const phone = normalizePhone(order.customer_phone);
  const externalId = cleanText(order.session_id || order.id).toLowerCase();

  const userData: Record<string, unknown> = {
    em: await hashedArray(email),
    ph: await hashedArray(phone),
    fn: await hashedArray(firstName),
    ln: await hashedArray(lastName),
    external_id: await hashedArray(externalId),
  };

  if (cleanText(order.meta_fbp)) userData.fbp = cleanText(order.meta_fbp);
  if (cleanText(order.meta_fbc)) userData.fbc = cleanText(order.meta_fbc);
  if (cleanText(order.meta_client_ip_address) && order.meta_client_ip_address !== 'unknown') {
    userData.client_ip_address = cleanText(order.meta_client_ip_address);
  }
  if (cleanText(order.meta_client_user_agent)) {
    userData.client_user_agent = cleanText(order.meta_client_user_agent);
  }

  Object.keys(userData).forEach((key) => {
    if (userData[key] === undefined) delete userData[key];
  });

  return userData;
}

function customData(order: Record<string, any>) {
  return {
    currency: String(order.currency || 'BRL'),
    value: Number((Number(order.amount_cents) / 100).toFixed(2)),
    content_name: cleanText(order.product_name),
    content_ids: [cleanText(order.product_id)],
    content_type: 'product',
    num_items: 1,
    order_id: String(order.id),
    payment_method: 'pix',
  };
}

export async function buildMetaPurchaseEvent(order: Record<string, any>) {
  return {
    event_name: 'Purchase',
    event_time: eventTimestamp(order.fulfilled_at || order.updated_at),
    event_id: String(order.id),
    event_source_url: cleanText(order.meta_event_source_url) || DEFAULT_EVENT_SOURCE_URL,
    action_source: 'website',
    user_data: await buildUserData(order),
    custom_data: customData(order),
  };
}

export async function buildMetaInitiateCheckoutEvent(order: Record<string, any>) {
  return {
    event_name: 'InitiateCheckout',
    event_time: eventTimestamp(order.created_at),
    event_id: cleanText(order.meta_initiate_checkout_event_id) || `ic_${order.id}`,
    event_source_url: cleanText(order.meta_event_source_url) || DEFAULT_EVENT_SOURCE_URL,
    action_source: 'website',
    user_data: await buildUserData(order),
    custom_data: customData(order),
  };
}

async function deliverMetaEvent(supabase: any, order: Record<string, any>, event: Record<string, any>) {
  const requestPayload: Record<string, unknown> = { data: [event] };
  const testEventCode = cleanText(Deno.env.get('META_TEST_EVENT_CODE'));
  if (testEventCode) requestPayload.test_event_code = testEventCode;

  const { data: claimToken, error: claimError } = await supabase.rpc('claim_meta_conversion_delivery', {
    p_order_id: order.id,
    p_event_name: event.event_name,
    p_event_id: event.event_id,
    p_payload: requestPayload,
  });
  if (claimError) throw claimError;
  if (!claimToken) return { delivered: false, duplicate: true };

  const accessToken = cleanText(Deno.env.get('META_CAPI_ACCESS_TOKEN'));
  const pixelId = cleanText(Deno.env.get('META_PIXEL_ID')) || DEFAULT_META_PIXEL_ID;
  const graphVersion = cleanText(Deno.env.get('META_GRAPH_API_VERSION')) || DEFAULT_GRAPH_API_VERSION;

  let response: Response | null = null;
  let responseBody = '';
  let deliveryError: unknown = null;

  try {
    if (!accessToken || !/^\d+$/.test(pixelId) || !/^v\d+\.\d+$/.test(graphVersion)) {
      throw new Error('META_CAPI_CONFIGURATION_MISSING');
    }

    response = await fetch(`https://graph.facebook.com/${graphVersion}/${pixelId}/events`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
    responseBody = await response.text();
    if (!response.ok) throw new Error(`META_CAPI_HTTP_${response.status}`);

    const parsed = JSON.parse(responseBody || '{}');
    if (Number(parsed?.events_received) < 1) throw new Error('META_CAPI_EVENT_NOT_ACCEPTED');
  } catch (error) {
    deliveryError = error;
  }

  const success = Boolean(response?.ok && !deliveryError);
  const { data: finished, error: finishError } = await supabase.rpc('finish_meta_conversion_delivery', {
    p_order_id: order.id,
    p_event_name: event.event_name,
    p_claim_token: claimToken,
    p_success: success,
    p_http_status: response?.status ?? 0,
    p_response_body: responseBody,
    p_error: deliveryError instanceof Error ? deliveryError.message : String(deliveryError || ''),
  });
  if (finishError) throw finishError;
  if (!finished) return { delivered: false, duplicate: false, staleLease: true };
  if (!success) throw deliveryError ?? new Error('META_CAPI_DELIVERY_FAILED');

  return { delivered: true, duplicate: false };
}

export async function deliverMetaPurchase(supabase: any, order: Record<string, any>) {
  return deliverMetaEvent(supabase, order, await buildMetaPurchaseEvent(order));
}

export async function deliverMetaInitiateCheckout(supabase: any, order: Record<string, any>) {
  return deliverMetaEvent(supabase, order, await buildMetaInitiateCheckoutEvent(order));
}

export function runInBackground(task: Promise<unknown>, label: string) {
  const guardedTask = task.catch((error) => {
    console.error(`[${label}]`, error instanceof Error ? error.message : error);
  });
  const edgeRuntime = (globalThis as any).EdgeRuntime;
  if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(guardedTask);
}

export async function processPendingMetaConversions(supabase: any, limit = 25) {
  const { data: deliveries, error } = await supabase
    .from('meta_conversion_deliveries')
    .select('order_id, event_name')
    .in('delivery_status', ['queued', 'failed', 'processing'])
    .lt('attempts', 10)
    .order('next_attempt_at', { ascending: true })
    .limit(Math.max(1, Math.min(100, limit)));
  if (error) throw error;

  const results = await Promise.allSettled((deliveries ?? []).map(async (delivery: Record<string, any>) => {
    const { data: order, error: orderError } = await supabase
      .from('pix_orders')
      .select('*')
      .eq('id', delivery.order_id)
      .maybeSingle();
    if (orderError || !order) throw orderError ?? new Error('ORDER_NOT_FOUND');
    return delivery.event_name === 'Purchase'
      ? deliverMetaPurchase(supabase, order)
      : deliverMetaInitiateCheckout(supabase, order);
  }));

  return {
    inspected: results.length,
    fulfilled: results.filter((result) => result.status === 'fulfilled').length,
    rejected: results.filter((result) => result.status === 'rejected').length,
  };
}
