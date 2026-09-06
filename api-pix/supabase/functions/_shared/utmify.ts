// @ts-nocheck
const UTMIFY_ENDPOINT = 'https://api.utmify.com.br/api-credentials/orders';
const META_UTMIFY_TOKEN_FALLBACK = 'Szz1ObkJ95rX3A8C3M7VcjACLPHBRAr5HGx4';

function formatDate(value: string | Date | null | undefined) {
  const date = value ? new Date(value) : new Date();
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export async function deliverMetaUtmifyPaidOrder(supabase: any, order: Record<string, any>) {
  const token = Deno.env.get('UTMIFY_API_TOKEN') ?? META_UTMIFY_TOKEN_FALLBACK;
  if (!token) throw new Error('UTMIFY_CONFIGURATION_MISSING');

  const payload = {
    orderId: String(order.id),
    platform: 'TemploDeLuzMeta',
    paymentMethod: 'pix',
    status: 'paid',
    createdAt: formatDate(order.created_at),
    approvedDate: formatDate(order.updated_at),
    refundedAt: null,
    customer: {
      name: String(order.customer_name || 'Consulente Templo de Luz'),
      email: String(order.customer_email || 'contato@templodeluz.com'),
      phone: order.customer_phone ? String(order.customer_phone) : null,
      document: order.customer_cpf ? String(order.customer_cpf) : null,
      country: 'BR',
    },
    products: [{
      id: String(order.product_id || 'carta_sagrada'),
      name: String(order.product_name || 'Carta Psicografada Sagrada'),
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: Number(order.amount_cents),
    }],
    trackingParameters: {
      src: order.src || null,
      sck: order.sck || null,
      utm_source: order.utm_source || null,
      utm_medium: order.utm_medium || null,
      utm_campaign: order.utm_campaign || null,
      utm_content: order.utm_content || null,
      utm_term: order.utm_term || null,
    },
    commission: {
      totalPriceInCents: Number(order.amount_cents),
      gatewayFeeInCents: 0,
      userCommissionInCents: Number(order.amount_cents),
      currency: 'BRL',
    },
    isTest: false,
  };

  const { data: claimed, error: claimError } = await supabase.rpc('claim_utmify_delivery', {
    p_order_id: order.id,
    p_destination: 'meta',
    p_event_status: 'paid',
    p_payload: payload,
  });
  if (claimError) throw claimError;
  if (!claimed) return { delivered: false, duplicate: true };

  let response: Response | null = null;
  let responseBody = '';
  let deliveryError: unknown = null;
  try {
    response = await fetch(UTMIFY_ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', 'x-api-token': token },
      body: JSON.stringify(payload),
    });
    responseBody = await response.text();
    if (!response.ok) throw new Error(`UTMIFY_HTTP_${response.status}`);
  } catch (error) {
    deliveryError = error;
  }

  const success = Boolean(response?.ok && !deliveryError);
  const { error: finishError } = await supabase.rpc('finish_utmify_delivery', {
    p_order_id: order.id,
    p_destination: 'meta',
    p_event_status: 'paid',
    p_success: success,
    p_http_status: response?.status ?? 0,
    p_response_body: responseBody,
    p_error: deliveryError instanceof Error ? deliveryError.message : null,
  });
  if (finishError) throw finishError;
  if (!success) throw deliveryError ?? new Error('UTMIFY_DELIVERY_FAILED');
  return { delivered: true, duplicate: false };
}
